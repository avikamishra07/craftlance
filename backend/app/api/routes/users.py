from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserMe, UserPublic, OnboardingRequest, UpdateProfileRequest
from app.schemas.common import MessageResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


def _compute_completeness(user: User) -> int:
    """Score 0-100 based on filled profile fields."""
    fields = [
        user.avatar_url, user.bio, user.title, user.location,
        user.skills and len(user.skills) > 0,
        user.hourly_rate, user.linkedin_url or user.github_url or user.website_url,
    ]
    filled = sum(1 for f in fields if f)
    return int((filled / len(fields)) * 100)


@router.get("/me", response_model=UserMe)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserMe)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)

    current_user.profile_completeness = _compute_completeness(current_user)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/onboarding", response_model=UserMe)
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)

    current_user.onboarding_completed = True
    current_user.profile_completeness = _compute_completeness(current_user)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserPublic)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    import uuid
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = db.query(User).filter(User.id == uid, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/", response_model=list[UserPublic])
def list_freelancers(
    skill: str | None = None,
    min_rate: int | None = None,
    max_rate: int | None = None,
    availability: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    from app.models.user import UserRole, AvailabilityStatus
    query = db.query(User).filter(
        User.is_active == True,
        User.role.in_([UserRole.freelancer, UserRole.both]),
        User.onboarding_completed == True,
    )
    if skill:
        query = query.filter(User.skills.any(skill))
    if min_rate:
        query = query.filter(User.hourly_rate >= min_rate)
    if max_rate:
        query = query.filter(User.hourly_rate <= max_rate)
    if availability:
        query = query.filter(User.availability == availability)

    query = query.order_by(User.reputation_score.desc())
    offset = (page - 1) * page_size
    return query.offset(offset).limit(page_size).all()
