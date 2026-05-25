import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import get_current_user, require_freelancer
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.proposal import Proposal, ProposalStatus
from app.schemas.proposal import ProposalCreate, ProposalOut, ProposalStatusUpdate, FreelancerSummary
from app.schemas.common import MessageResponse

router = APIRouter(tags=["proposals"])

# Valid status transitions:
#   Client:     pending → shortlisted, pending/shortlisted → accepted/rejected
#   Freelancer: pending/shortlisted → withdrawn
_CLIENT_TRANSITIONS = {
    ProposalStatus.pending: {ProposalStatus.shortlisted, ProposalStatus.rejected, ProposalStatus.accepted},
    ProposalStatus.shortlisted: {ProposalStatus.accepted, ProposalStatus.rejected},
}
_FREELANCER_TRANSITIONS = {
    ProposalStatus.pending: {ProposalStatus.withdrawn},
    ProposalStatus.shortlisted: {ProposalStatus.withdrawn},
}


def _build_proposal_out(proposal: Proposal) -> ProposalOut:
    out = ProposalOut.model_validate(proposal)
    if proposal.freelancer:
        out.freelancer = FreelancerSummary.model_validate(proposal.freelancer)
    if proposal.project:
        out.project_title = proposal.project.title
    return out


# ── Submit proposal ────────────────────────────────────────────────────────────

@router.post(
    "/projects/{project_id}/proposals",
    response_model=ProposalOut,
    status_code=status.HTTP_201_CREATED,
)
def submit_proposal(
    project_id: uuid.UUID,
    payload: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_freelancer),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.status != ProjectStatus.open:
        raise HTTPException(status_code=400, detail="Project is not accepting proposals")

    if project.client_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot bid on your own project")

    # Duplicate check
    existing = (
        db.query(Proposal)
        .filter(
            Proposal.project_id == project_id,
            Proposal.freelancer_id == current_user.id,
            Proposal.status != ProposalStatus.withdrawn,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already submitted a proposal for this project")

    proposal = Proposal(
        project_id=project_id,
        freelancer_id=current_user.id,
        bid_amount=payload.bid_amount,
        timeline_days=payload.timeline_days,
        cover_letter=payload.cover_letter,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    proposal = (
        db.query(Proposal)
        .options(joinedload(Proposal.freelancer), joinedload(Proposal.project))
        .filter(Proposal.id == proposal.id)
        .first()
    )
    return _build_proposal_out(proposal)


# ── List proposals for a project (client only) ────────────────────────────────

@router.get("/projects/{project_id}/proposals", response_model=list[ProposalOut])
def list_project_proposals(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can view proposals")

    proposals = (
        db.query(Proposal)
        .options(joinedload(Proposal.freelancer), joinedload(Proposal.project))
        .filter(Proposal.project_id == project_id)
        .order_by(Proposal.created_at.desc())
        .all()
    )
    return [_build_proposal_out(p) for p in proposals]


# ── My proposals (freelancer view) ────────────────────────────────────────────

@router.get("/proposals/mine", response_model=list[ProposalOut])
def my_proposals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proposals = (
        db.query(Proposal)
        .options(joinedload(Proposal.project), joinedload(Proposal.freelancer))
        .filter(Proposal.freelancer_id == current_user.id)
        .order_by(Proposal.created_at.desc())
        .all()
    )
    return [_build_proposal_out(p) for p in proposals]


# ── Single proposal ────────────────────────────────────────────────────────────

@router.get("/proposals/{proposal_id}", response_model=ProposalOut)
def get_proposal(
    proposal_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proposal = (
        db.query(Proposal)
        .options(joinedload(Proposal.freelancer), joinedload(Proposal.project))
        .filter(Proposal.id == proposal_id)
        .first()
    )
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    is_freelancer_owner = proposal.freelancer_id == current_user.id
    is_project_client = proposal.project and proposal.project.client_id == current_user.id

    if not (is_freelancer_owner or is_project_client):
        raise HTTPException(status_code=403, detail="Access denied")

    return _build_proposal_out(proposal)


# ── Update proposal status ─────────────────────────────────────────────────────

@router.patch("/proposals/{proposal_id}", response_model=ProposalOut)
def update_proposal_status(
    proposal_id: uuid.UUID,
    payload: ProposalStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proposal = (
        db.query(Proposal)
        .options(joinedload(Proposal.freelancer), joinedload(Proposal.project))
        .filter(Proposal.id == proposal_id)
        .first()
    )
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    is_freelancer_owner = proposal.freelancer_id == current_user.id
    is_project_client = (
        proposal.project and proposal.project.client_id == current_user.id
    )

    if not (is_freelancer_owner or is_project_client):
        raise HTTPException(status_code=403, detail="Access denied")

    # Enforce transition rules
    if is_project_client:
        allowed = _CLIENT_TRANSITIONS.get(proposal.status, set())
    else:
        allowed = _FREELANCER_TRANSITIONS.get(proposal.status, set())

    if payload.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{proposal.status}' to '{payload.status}'",
        )

    # If accepting: reject all other pending proposals for the same project
    if payload.status == ProposalStatus.accepted:
        db.query(Proposal).filter(
            Proposal.project_id == proposal.project_id,
            Proposal.id != proposal.id,
            Proposal.status.in_([ProposalStatus.pending, ProposalStatus.shortlisted]),
        ).update({"status": ProposalStatus.rejected})

        # Close the project
        if proposal.project:
            proposal.project.status = ProjectStatus.in_progress

    proposal.status = payload.status
    db.commit()
    db.refresh(proposal)

    proposal = (
        db.query(Proposal)
        .options(joinedload(Proposal.freelancer), joinedload(Proposal.project))
        .filter(Proposal.id == proposal.id)
        .first()
    )
    return _build_proposal_out(proposal)
