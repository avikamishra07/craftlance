import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import get_current_user, require_client
from app.models.user import User
from app.models.project import Project, ProjectStatus
from app.models.proposal import Proposal
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate, ClientSummary
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(prefix="/projects", tags=["projects"])


def _build_project_out(project: Project) -> ProjectOut:
    """Attach computed fields (proposal_count, client summary) to ProjectOut."""
    out = ProjectOut.model_validate(project)
    out.proposal_count = len(project.proposals)
    if project.client:
        out.client = ClientSummary.model_validate(project.client)
    return out


# ── Browse / list ────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[ProjectOut])
def list_projects(
    q: Optional[str] = Query(None, description="Search title or description"),
    skills: Optional[str] = Query(None, description="Comma-separated skill list"),
    project_type: Optional[str] = Query(None),
    budget_min: Optional[int] = Query(None),
    budget_max: Optional[int] = Query(None),
    status: Optional[str] = Query("open"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Project)
        .options(joinedload(Project.client), joinedload(Project.proposals))
    )

    # Status filter (default: open only)
    if status and status != "all":
        try:
            query = query.filter(Project.status == ProjectStatus(status))
        except ValueError:
            pass

    # Full-text search on title/description
    if q:
        search = f"%{q.lower()}%"
        query = query.filter(
            or_(
                Project.title.ilike(search),
                Project.description.ilike(search),
            )
        )

    # Skills filter: project must contain ALL requested skills
    if skills:
        skill_list = [s.strip() for s in skills.split(",") if s.strip()]
        for skill in skill_list:
            query = query.filter(Project.required_skills.any(skill))

    if project_type:
        query = query.filter(Project.project_type == project_type)

    if budget_min is not None:
        query = query.filter(Project.budget_min >= budget_min)

    if budget_max is not None:
        query = query.filter(Project.budget_max <= budget_max)

    total = query.count()
    projects = (
        query.order_by(Project.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedResponse(
        items=[_build_project_out(p) for p in projects],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
        has_prev=page > 1,
    )


# ── My projects (client view) ────────────────────────────────────────────────

@router.get("/mine", response_model=list[ProjectOut])
def my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = (
        db.query(Project)
        .options(joinedload(Project.proposals))
        .filter(Project.client_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return [_build_project_out(p) for p in projects]


# ── Single project ────────────────────────────────────────────────────────────

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .options(joinedload(Project.client), joinedload(Project.proposals))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Increment view count (skip for project owner)
    if project.client_id != current_user.id:
        project.views_count += 1
        db.commit()
        db.refresh(project)

    return _build_project_out(project)


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client),
):
    project = Project(
        client_id=current_user.id,
        title=payload.title,
        description=payload.description,
        required_skills=payload.required_skills,
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
        deadline=payload.deadline,
        project_type=payload.project_type,
        status=payload.status,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Re-fetch with joins
    project = (
        db.query(Project)
        .options(joinedload(Project.client), joinedload(Project.proposals))
        .filter(Project.id == project.id)
        .first()
    )
    return _build_project_out(project)


# ── Update ────────────────────────────────────────────────────────────────────

@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not the project owner")

    if project.status == ProjectStatus.completed:
        raise HTTPException(status_code=400, detail="Completed projects cannot be edited")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    project = (
        db.query(Project)
        .options(joinedload(Project.client), joinedload(Project.proposals))
        .filter(Project.id == project.id)
        .first()
    )
    return _build_project_out(project)


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{project_id}", response_model=MessageResponse)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not the project owner")

    if project.status == ProjectStatus.in_progress:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a project that is in progress. Cancel it first.",
        )

    db.delete(project)
    db.commit()
    return MessageResponse(message="Project deleted successfully")
