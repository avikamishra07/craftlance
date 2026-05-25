import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.contract import Contract, ContractStatus
from app.models.milestone import Milestone, MilestoneStatus
from app.models.message import Message
from app.models.proposal import Proposal
from app.models.project import Project, ProjectStatus
from app.schemas.contract import ContractOut, ContractStatusUpdate, UserBrief, ProjectBrief
from app.schemas.milestone import MilestoneCreate, MilestoneOut, MilestoneStatusUpdate
from app.schemas.message import MessageCreate, MessageOut, SenderBrief
from app.schemas.common import MessageResponse

router = APIRouter(tags=["contracts"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_contract(contract_id: uuid.UUID, db: Session) -> Contract:
    contract = (
        db.query(Contract)
        .options(
            joinedload(Contract.client),
            joinedload(Contract.freelancer),
            joinedload(Contract.project),
            joinedload(Contract.milestones),
            joinedload(Contract.messages),
        )
        .filter(Contract.id == contract_id)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


def _assert_party(contract: Contract, user: User) -> None:
    if contract.client_id != user.id and contract.freelancer_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied — not a contract party")


def _build_contract_out(c: Contract) -> ContractOut:
    out = ContractOut.model_validate(c)
    out.client     = UserBrief.model_validate(c.client) if c.client else None
    out.freelancer = UserBrief.model_validate(c.freelancer) if c.freelancer else None
    out.project    = ProjectBrief.model_validate(c.project) if c.project else None
    out.milestone_count       = len(c.milestones)
    out.completed_milestones  = sum(1 for m in c.milestones if m.status == MilestoneStatus.paid)
    out.unread_messages       = 0  # populated per-user in list endpoint
    return out


# ── Contract creation (auto-triggered on proposal accept in M3 routes) ────────
# This endpoint allows manual creation for testing / admin purposes.

@router.post("/contracts", response_model=ContractOut, status_code=status.HTTP_201_CREATED)
def create_contract(
    proposal_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a contract from an accepted proposal.
    Normally triggered automatically when client accepts a proposal — this
    endpoint exists for direct API testing.
    """
    proposal = (
        db.query(Proposal)
        .options(joinedload(Proposal.project))
        .filter(Proposal.id == proposal_id)
        .first()
    )
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if proposal.project.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project client can create a contract")

    # Idempotency: one contract per proposal
    existing = db.query(Contract).filter(Contract.proposal_id == proposal_id).first()
    if existing:
        return _build_contract_out(_load_contract(existing.id, db))

    total = proposal.bid_amount
    commission = int(total * 0.10)
    contract = Contract(
        proposal_id=proposal.id,
        project_id=proposal.project_id,
        client_id=proposal.project.client_id,
        freelancer_id=proposal.freelancer_id,
        total_amount=total,
        platform_commission=commission,
        freelancer_amount=total - commission,
    )
    db.add(contract)

    # Update project status
    proposal.project.status = ProjectStatus.in_progress
    db.commit()
    db.refresh(contract)

    return _build_contract_out(_load_contract(contract.id, db))


# ── List my contracts ─────────────────────────────────────────────────────────

@router.get("/contracts", response_model=list[ContractOut])
def list_my_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contracts = (
        db.query(Contract)
        .options(
            joinedload(Contract.client),
            joinedload(Contract.freelancer),
            joinedload(Contract.project),
            joinedload(Contract.milestones),
            joinedload(Contract.messages),
        )
        .filter(
            (Contract.client_id == current_user.id) |
            (Contract.freelancer_id == current_user.id)
        )
        .order_by(Contract.created_at.desc())
        .all()
    )

    result = []
    for c in contracts:
        out = _build_contract_out(c)
        # Personalised unread count
        out.unread_messages = sum(
            1 for m in c.messages
            if not m.is_read and m.sender_id != current_user.id
        )
        result.append(out)
    return result


# ── Single contract ───────────────────────────────────────────────────────────

@router.get("/contracts/{contract_id}", response_model=ContractOut)
def get_contract(
    contract_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = _load_contract(contract_id, db)
    _assert_party(contract, current_user)
    out = _build_contract_out(contract)
    out.unread_messages = sum(
        1 for m in contract.messages
        if not m.is_read and m.sender_id != current_user.id
    )
    return out


# ── Update contract status ────────────────────────────────────────────────────

@router.patch("/contracts/{contract_id}/status", response_model=ContractOut)
def update_contract_status(
    contract_id: uuid.UUID,
    payload: ContractStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = _load_contract(contract_id, db)
    _assert_party(contract, current_user)

    is_client     = contract.client_id == current_user.id
    is_freelancer = contract.freelancer_id == current_user.id

    # Transition rules
    allowed: dict[ContractStatus, set[ContractStatus]] = {}
    if is_client:
        allowed = {
            ContractStatus.active:  {ContractStatus.paused, ContractStatus.cancelled, ContractStatus.completed},
            ContractStatus.paused:  {ContractStatus.active, ContractStatus.cancelled},
            ContractStatus.disputed:{ContractStatus.completed, ContractStatus.cancelled},
        }
    elif is_freelancer:
        allowed = {
            ContractStatus.active: {ContractStatus.paused, ContractStatus.disputed},
            ContractStatus.paused: {ContractStatus.active},
        }

    if payload.status not in allowed.get(contract.status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition contract from '{contract.status}' to '{payload.status}'",
        )

    contract.status = payload.status
    if payload.status in (ContractStatus.completed, ContractStatus.cancelled):
        contract.ended_at = datetime.now(timezone.utc)
        if payload.status == ContractStatus.completed:
            contract.project.status = ProjectStatus.completed

    db.commit()
    return _build_contract_out(_load_contract(contract_id, db))


# ── Milestones ────────────────────────────────────────────────────────────────

@router.get("/contracts/{contract_id}/milestones", response_model=list[MilestoneOut])
def list_milestones(
    contract_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = _load_contract(contract_id, db)
    _assert_party(contract, current_user)
    return [MilestoneOut.model_validate(m) for m in contract.milestones]


@router.post(
    "/contracts/{contract_id}/milestones",
    response_model=MilestoneOut,
    status_code=status.HTTP_201_CREATED,
)
def add_milestone(
    contract_id: uuid.UUID,
    payload: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = _load_contract(contract_id, db)
    _assert_party(contract, current_user)

    if contract.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the client can add milestones")

    if contract.status != ContractStatus.active:
        raise HTTPException(status_code=400, detail="Can only add milestones to active contracts")

    milestone = Milestone(
        contract_id=contract_id,
        title=payload.title,
        description=payload.description,
        amount=payload.amount,
        due_date=payload.due_date,
        order_index=payload.order_index,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return MilestoneOut.model_validate(milestone)


@router.patch("/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone_status(
    milestone_id: uuid.UUID,
    payload: MilestoneStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract = _load_contract(milestone.contract_id, db)
    _assert_party(contract, current_user)

    is_client     = contract.client_id == current_user.id
    is_freelancer = contract.freelancer_id == current_user.id

    # Transition rules per role
    freelancer_transitions = {
        MilestoneStatus.pending:     {MilestoneStatus.in_progress},
        MilestoneStatus.in_progress: {MilestoneStatus.submitted},
        MilestoneStatus.revision_requested: {MilestoneStatus.submitted},
    }
    client_transitions = {
        MilestoneStatus.submitted: {MilestoneStatus.approved, MilestoneStatus.revision_requested},
    }

    allowed = freelancer_transitions if is_freelancer else client_transitions
    if payload.status not in allowed.get(milestone.status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition milestone from '{milestone.status}' to '{payload.status}'",
        )

    milestone.status = payload.status

    if payload.status == MilestoneStatus.submitted:
        milestone.submitted_at = datetime.now(timezone.utc)
        if payload.deliverable_urls:
            milestone.deliverable_urls = payload.deliverable_urls

    if payload.status == MilestoneStatus.approved:
        milestone.approved_at = datetime.now(timezone.utc)

    if payload.status == MilestoneStatus.revision_requested and payload.revision_note:
        milestone.revision_note = payload.revision_note

    db.commit()
    db.refresh(milestone)
    return MilestoneOut.model_validate(milestone)


# ── Messages ──────────────────────────────────────────────────────────────────

@router.get("/contracts/{contract_id}/messages", response_model=list[MessageOut])
def list_messages(
    contract_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = _load_contract(contract_id, db)
    _assert_party(contract, current_user)

    messages = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.contract_id == contract_id)
        .order_by(Message.sent_at.asc())
        .all()
    )

    # Mark incoming messages as read
    for m in messages:
        if m.sender_id != current_user.id and not m.is_read:
            m.is_read = True
    db.commit()

    result = []
    for m in messages:
        out = MessageOut.model_validate(m)
        if m.sender:
            out.sender = SenderBrief.model_validate(m.sender)
        result.append(out)
    return result


@router.post(
    "/contracts/{contract_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    contract_id: uuid.UUID,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = _load_contract(contract_id, db)
    _assert_party(contract, current_user)

    if contract.status in (ContractStatus.cancelled,):
        raise HTTPException(status_code=400, detail="Cannot message on a cancelled contract")

    message = Message(
        contract_id=contract_id,
        sender_id=current_user.id,
        content=payload.content,
        file_urls=payload.file_urls,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Re-fetch with sender join
    message = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.id == message.id)
        .first()
    )
    out = MessageOut.model_validate(message)
    if message.sender:
        out.sender = SenderBrief.model_validate(message.sender)
    return out
