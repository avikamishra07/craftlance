"""
Payments routes — M5

POST /payments/fund-escrow          Client funds escrow for a milestone
POST /payments/release/:milestoneId Release funds to freelancer (milestone approved)
GET  /payments/history              All payments for current user
GET  /payments/balance              Freelancer pending + available balance
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.payment import Payment, PaymentStatus
from app.models.milestone import Milestone, MilestoneStatus
from app.models.contract import Contract, ContractStatus
from app.schemas.payment import PaymentOut, BalanceOut, FundEscrowPayload, UserBrief

router = APIRouter(prefix="/payments", tags=["payments"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _build_payment_out(p: Payment) -> PaymentOut:
    out = PaymentOut.model_validate(p)
    if p.payer:
        out.payer = UserBrief.model_validate(p.payer)
    if p.payee:
        out.payee = UserBrief.model_validate(p.payee)
    return out


def _load_payment_with_joins(payment_id: uuid.UUID, db: Session) -> Payment:
    return (
        db.query(Payment)
        .options(joinedload(Payment.payer), joinedload(Payment.payee))
        .filter(Payment.id == payment_id)
        .first()
    )


# ── Fund escrow ────────────────────────────────────────────────────────────────

@router.post(
    "/fund-escrow",
    response_model=PaymentOut,
    status_code=status.HTTP_201_CREATED,
)
def fund_escrow(
    payload: FundEscrowPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Client funds escrow for a specific milestone.
    Creates a Payment row (or no-ops if already funded).
    Sets payment status → processing.
    """
    milestone = (
        db.query(Milestone)
        .filter(Milestone.id == payload.milestone_id)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract = db.query(Contract).filter(Contract.id == milestone.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the client can fund escrow")

    if contract.status != ContractStatus.active:
        raise HTTPException(status_code=400, detail="Contract must be active to fund escrow")

    if milestone.status == MilestoneStatus.pending:
        raise HTTPException(
            status_code=400,
            detail="Cannot fund escrow for a milestone that hasn't started yet",
        )

    # Idempotency: one payment per milestone
    existing = db.query(Payment).filter(Payment.milestone_id == milestone.id).first()
    if existing:
        if existing.status in (PaymentStatus.processing, PaymentStatus.completed):
            # Re-fetch with joins
            p = _load_payment_with_joins(existing.id, db)
            return _build_payment_out(p)
        # Re-activate a pending/failed payment
        existing.status = PaymentStatus.processing
        existing.escrow_funded_at = datetime.now(timezone.utc)
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        p = _load_payment_with_joins(existing.id, db)
        return _build_payment_out(p)

    gross = milestone.amount
    fee   = int(gross * 0.10)
    net   = gross - fee

    payment = Payment(
        milestone_id     = milestone.id,
        contract_id      = contract.id,
        payer_id         = contract.client_id,
        payee_id         = contract.freelancer_id,
        gross_amount     = gross,
        platform_fee     = fee,
        net_amount       = net,
        status           = PaymentStatus.processing,
        escrow_funded_at = datetime.now(timezone.utc),
        notes            = payload.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    p = _load_payment_with_joins(payment.id, db)
    return _build_payment_out(p)


# ── Release payment ────────────────────────────────────────────────────────────

@router.post(
    "/release/{milestone_id}",
    response_model=PaymentOut,
)
def release_payment(
    milestone_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Client releases escrowed funds to freelancer after milestone is approved.
    Sets payment status → completed.
    Sets milestone status → paid.
    """
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract = db.query(Contract).filter(Contract.id == milestone.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the client can release payment")

    if milestone.status != MilestoneStatus.approved:
        raise HTTPException(
            status_code=400,
            detail=f"Milestone must be approved before releasing payment (current: {milestone.status})",
        )

    payment = db.query(Payment).filter(Payment.milestone_id == milestone_id).first()
    if not payment:
        raise HTTPException(
            status_code=400,
            detail="Escrow has not been funded for this milestone. Fund escrow first.",
        )

    if payment.status == PaymentStatus.completed:
        p = _load_payment_with_joins(payment.id, db)
        return _build_payment_out(p)

    if payment.status != PaymentStatus.processing:
        raise HTTPException(
            status_code=400,
            detail=f"Payment is not in escrow (status: {payment.status})",
        )

    # Release
    payment.status      = PaymentStatus.completed
    payment.released_at = datetime.now(timezone.utc)
    milestone.status    = MilestoneStatus.paid

    db.commit()
    db.refresh(payment)

    p = _load_payment_with_joins(payment.id, db)
    return _build_payment_out(p)


# ── Payment history ────────────────────────────────────────────────────────────

@router.get("/history", response_model=list[PaymentOut])
def payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All payments where user is payer (client) or payee (freelancer)."""
    payments = (
        db.query(Payment)
        .options(joinedload(Payment.payer), joinedload(Payment.payee))
        .filter(
            (Payment.payer_id == current_user.id) |
            (Payment.payee_id == current_user.id)
        )
        .order_by(Payment.created_at.desc())
        .all()
    )
    return [_build_payment_out(p) for p in payments]


# ── Freelancer balance ─────────────────────────────────────────────────────────

@router.get("/balance", response_model=BalanceOut)
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Freelancer's balance breakdown:
    - pending_amount:   escrow funded (processing) but not yet released
    - available_amount: released (completed) payments
    - total_earned:     lifetime completed net amounts
    """
    payments = (
        db.query(Payment)
        .filter(Payment.payee_id == current_user.id)
        .all()
    )

    pending_amount   = sum(p.net_amount for p in payments if p.status == PaymentStatus.processing)
    available_amount = sum(p.net_amount for p in payments if p.status == PaymentStatus.completed)
    total_earned     = available_amount  # lifetime completed

    return BalanceOut(
        pending_amount   = pending_amount,
        available_amount = available_amount,
        total_earned     = total_earned,
    )
