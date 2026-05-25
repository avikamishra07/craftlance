"""
Reviews routes — M6

POST /contracts/:id/review          Submit a review after contract completed
GET  /users/:id/reviews             List reviews received by a user
GET  /users/:id/reputation          Reputation breakdown (avg ratings per category)
GET  /reviews/mine                  Reviews I have left (as reviewer)
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.review import Review
from app.models.contract import Contract, ContractStatus
from app.schemas.review import ReviewCreate, ReviewOut, ReputationOut, UserBrief

router = APIRouter(tags=["reviews"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_review_out(r: Review) -> ReviewOut:
    out = ReviewOut.model_validate(r)
    if r.reviewer:
        out.reviewer = UserBrief.model_validate(r.reviewer)
    if r.reviewee:
        out.reviewee = UserBrief.model_validate(r.reviewee)
    return out


def _avg(values: list) -> Optional[float]:
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), 2) if vals else None


# ── Submit review ─────────────────────────────────────────────────────────────

@router.post(
    "/contracts/{contract_id}/review",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def submit_review(
    contract_id: uuid.UUID,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a review for a completed contract.
    One review per party (client reviews freelancer; freelancer reviews client).
    """
    contract = (
        db.query(Contract)
        .filter(Contract.id == contract_id)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Must be a party to the contract
    if current_user.id not in (contract.client_id, contract.freelancer_id):
        raise HTTPException(status_code=403, detail="You are not a party to this contract")

    if contract.status != ContractStatus.completed:
        raise HTTPException(status_code=400, detail="Reviews can only be left on completed contracts")

    # Determine reviewee
    reviewee_id = (
        contract.freelancer_id
        if current_user.id == contract.client_id
        else contract.client_id
    )

    # Idempotency guard
    existing = (
        db.query(Review)
        .filter(Review.contract_id == contract_id, Review.reviewer_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this contract")

    review = Review(
        contract_id=contract_id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        **payload.model_dump(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    r = (
        db.query(Review)
        .options(joinedload(Review.reviewer), joinedload(Review.reviewee))
        .filter(Review.id == review.id)
        .first()
    )
    return _build_review_out(r)


# ── List reviews for a user ───────────────────────────────────────────────────

@router.get("/users/{user_id}/reviews", response_model=list[ReviewOut])
def list_user_reviews(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Paginated list of reviews received by a user."""
    offset = (page - 1) * page_size
    reviews = (
        db.query(Review)
        .options(joinedload(Review.reviewer), joinedload(Review.reviewee))
        .filter(Review.reviewee_id == user_id)
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return [_build_review_out(r) for r in reviews]


# ── Reputation breakdown ──────────────────────────────────────────────────────

@router.get("/users/{user_id}/reputation", response_model=ReputationOut)
def get_reputation(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate reputation stats for a user."""
    reviews = (
        db.query(Review)
        .filter(Review.reviewee_id == user_id)
        .all()
    )

    if not reviews:
        return ReputationOut(user_id=user_id, review_count=0)

    return ReputationOut(
        user_id=user_id,
        review_count=len(reviews),
        avg_overall=_avg([r.overall_rating for r in reviews]),
        avg_communication=_avg([r.communication_rating for r in reviews]),
        avg_quality=_avg([r.quality_rating for r in reviews]),
        avg_ontime=_avg([r.ontime_rating for r in reviews]),
        avg_recommend=_avg([r.recommend_rating for r in reviews]),
    )


# ── Reviews I've left ─────────────────────────────────────────────────────────

@router.get("/reviews/mine", response_model=list[ReviewOut])
def my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reviews the current user has written (as reviewer)."""
    reviews = (
        db.query(Review)
        .options(joinedload(Review.reviewer), joinedload(Review.reviewee))
        .filter(Review.reviewer_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [_build_review_out(r) for r in reviews]


# ── Check if current user has reviewed a contract ────────────────────────────

@router.get("/contracts/{contract_id}/review/status")
def review_status(
    contract_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns whether the current user has already reviewed this contract."""
    existing = (
        db.query(Review)
        .filter(Review.contract_id == contract_id, Review.reviewer_id == current_user.id)
        .first()
    )
    return {"has_reviewed": existing is not None}
