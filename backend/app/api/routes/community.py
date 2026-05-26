"""
Community routes — M9

GET  /freelancers          Searchable, filterable freelancer directory + pagination
POST /freelancers/:id/save Save freelancer to favourites
DELETE /freelancers/:id/save  Unsave freelancer
GET  /freelancers/saved    List saved freelancers
GET  /users/:userId/verified-skills  Public verified skills for a user profile
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, func, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.skill_verification import SkillVerification  # M8
from app.models.community import SavedFreelancer
from app.schemas.community import (
    FreelancerCard,
    FreelancerDirectoryResponse,
    SavedFreelancersResponse,
    VerifiedSkillPublic,
)

router = APIRouter(tags=["community"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _best_badge_per_skill(
    verifications: list[SkillVerification],
) -> list[VerifiedSkillPublic]:
    """Return only the best badge per skill_key."""
    RANK = {"bronze": 1, "silver": 2, "gold": 3}
    best: dict[str, SkillVerification] = {}
    for v in verifications:
        if v.badge_level is None:
            continue
        existing = best.get(v.skill_key)
        if existing is None or RANK.get(v.badge_level, 0) > RANK.get(existing.badge_level, 0):
            best[v.skill_key] = v
    return [
        VerifiedSkillPublic(
            skill_key=v.skill_key,
            skill_label=v.skill_label,
            badge_level=v.badge_level,
        )
        for v in best.values()
    ]


def _build_card(user: User, db: Session, saved_ids: set) -> FreelancerCard:
    # ERROR 4 FIX: Reputation is not a separate model — reputation data lives
    # directly on the User row (reputation_score, total_projects, etc.).
    # Removed db.query(Reputation) which caused NameError on every request.
    verifications = (
        db.query(SkillVerification)
        .filter(SkillVerification.user_id == user.id, SkillVerification.badge_level.isnot(None))
        .all()
    )
    return FreelancerCard(
        id=str(user.id),

        full_name=user.full_name,
        avatar_url=user.avatar_url,
        title=user.title,
        bio=user.bio,
        skills=user.skills or [],
        hourly_rate=user.hourly_rate,
        availability=user.availability,
        is_verified=user.is_verified,
        reputation_score=user.reputation_score,   # read directly from User
        completed_jobs=user.total_projects,        # read directly from User
        verified_skills=_best_badge_per_skill(verifications),
        is_saved=str(user.id) in saved_ids,
    )


# ── GET /freelancers ──────────────────────────────────────────────────────────

@router.get("/freelancers", response_model=FreelancerDirectoryResponse)
def list_freelancers(
    # search
    q:               Optional[str]   = Query(None,  description="Full-text search on name/title/bio"),
    # filters
    skills:          Optional[str]   = Query(None,  description="Comma-separated skill tags"),
    min_rate:        Optional[float] = Query(None,  ge=0),
    max_rate:        Optional[float] = Query(None,  ge=0),
    availability:    Optional[str]   = Query(None,  description="available|busy|not_available"),
    min_reputation:  Optional[float] = Query(None,  ge=0, le=100),
    verified_only:   bool            = Query(False),
    # pagination
    page:            int             = Query(1,  ge=1),
    per_page:        int             = Query(20, ge=1, le=100),
    db:              Session         = Depends(get_db),
    current_user:    User            = Depends(get_current_user),
):
    """Browse all freelancers with search and filter."""
    q_obj = db.query(User).filter(
        User.role.in_([UserRole.freelancer, UserRole.both]),
        User.is_active == True,
    )

    # free-text search across name / title / bio
    if q:
        term = f"%{q}%"
        q_obj = q_obj.filter(
            or_(
                User.full_name.ilike(term),
                User.title.ilike(term),
                User.bio.ilike(term),
            )
        )

    # skill filter — User.skills is a PostgreSQL ARRAY(String)
    if skills:
        skill_list = [s.strip() for s in skills.split(",") if s.strip()]
        for skill in skill_list:
            q_obj = q_obj.filter(User.skills.any(skill))

    # rate filters
    if min_rate is not None:
        q_obj = q_obj.filter(User.hourly_rate >= min_rate)
    if max_rate is not None:
        q_obj = q_obj.filter(User.hourly_rate <= max_rate)

    # availability
    if availability:
        q_obj = q_obj.filter(User.availability == availability)

    # verified only
    if verified_only:
        q_obj = q_obj.filter(User.is_verified == True)

    # ERROR 4 FIX: reputation filter now uses User.reputation_score directly —
    # no join needed, no Reputation model needed.
    if min_reputation is not None:
        q_obj = q_obj.filter(User.reputation_score >= min_reputation)

    total = q_obj.count()
    users = (
        q_obj.order_by(desc(User.reputation_score))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    # gather saved IDs for current user
    saved_rows = (
        db.query(SavedFreelancer.freelancer_id)
        .filter(SavedFreelancer.user_id == current_user.id)
        .all()
    )
    saved_ids = {str(r.freelancer_id) for r in saved_rows}

    cards = [_build_card(u, db, saved_ids) for u in users]

    return FreelancerDirectoryResponse(
        freelancers=cards,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page,
    )


# ── POST /freelancers/:id/save ─────────────────────────────────────────────────

@router.post("/freelancers/{freelancer_id}/save", status_code=status.HTTP_201_CREATED)
def save_freelancer(
    freelancer_id: UUID,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    """Save a freelancer to favourites."""
    target = db.query(User).filter(User.id == freelancer_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot save yourself")

    existing = (
        db.query(SavedFreelancer)
        .filter(
            SavedFreelancer.user_id == current_user.id,
            SavedFreelancer.freelancer_id == freelancer_id,
        )
        .first()
    )
    if existing:
        return {"detail": "Already saved"}

    row = SavedFreelancer(user_id=current_user.id, freelancer_id=freelancer_id)
    db.add(row)
    db.commit()
    return {"detail": "Saved"}


# ── DELETE /freelancers/:id/save ──────────────────────────────────────────────

@router.delete("/freelancers/{freelancer_id}/save", status_code=status.HTTP_200_OK)
def unsave_freelancer(
    freelancer_id: UUID,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    """Remove a freelancer from favourites."""
    row = (
        db.query(SavedFreelancer)
        .filter(
            SavedFreelancer.user_id == current_user.id,
            SavedFreelancer.freelancer_id == freelancer_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not saved")
    db.delete(row)
    db.commit()
    return {"detail": "Removed"}


# ── GET /freelancers/saved ────────────────────────────────────────────────────

@router.get("/freelancers/saved", response_model=SavedFreelancersResponse)
def list_saved_freelancers(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Return all freelancers saved by the current user."""
    rows = (
        db.query(SavedFreelancer)
        .filter(SavedFreelancer.user_id == current_user.id)
        .order_by(desc(SavedFreelancer.saved_at))
        .all()
    )
    saved_ids = {str(r.freelancer_id) for r in rows}
    freelancer_ids = [r.freelancer_id for r in rows]

    if not freelancer_ids:
        return SavedFreelancersResponse(freelancers=[], total=0)

    users = db.query(User).filter(User.id.in_(freelancer_ids)).all()
    cards = [_build_card(u, db, saved_ids) for u in users]

    return SavedFreelancersResponse(freelancers=cards, total=len(cards))


# ── GET /users/:userId/verified-skills ────────────────────────────────────────

@router.get("/users/{user_id}/verified-skills", response_model=list[VerifiedSkillPublic])
def get_user_verified_skills(
    user_id: UUID,
    db:      Session = Depends(get_db),
):
    """Public endpoint — return verified skill badges for any user's profile."""
    verifications = (
        db.query(SkillVerification)
        .filter(
            SkillVerification.user_id == user_id,
            SkillVerification.badge_level.isnot(None),
        )
        .all()
    )
    return _best_badge_per_skill(verifications)
