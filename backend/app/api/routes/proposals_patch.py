"""
proposals.py — M9 misc fix

Patch for update_proposal_status:
When a proposal transitions to `accepted`, automatically create the Contract
in the same DB transaction so clients never need to call POST /contracts manually.

Drop-in replacement for the existing `update_proposal_status` function inside
app/api/routes/proposals.py (or wherever it currently lives).
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.project import Project
from app.schemas.proposals import ProposalStatusUpdate, ProposalOut

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.patch("/{proposal_id}/status", response_model=ProposalOut)
def update_proposal_status(
    proposal_id:  str,
    payload:      ProposalStatusUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Update a proposal's status.

    M9 change: when status → 'accepted', a Contract is automatically created
    within the same transaction.  Rejects any other pending proposals for the
    same project so the project is effectively awarded.
    """
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    project = db.query(Project).filter(Project.id == proposal.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only the project owner may change status
    if project.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised")

    old_status = proposal.status
    proposal.status = payload.status
    proposal.updated_at = datetime.utcnow()

    # ── Auto-create contract when accepted ────────────────────────────────────
    if payload.status == "accepted" and old_status != "accepted":
        # Check no contract already exists for this proposal
        existing_contract = (
            db.query(Contract)
            .filter(Contract.proposal_id == proposal.id)
            .first()
        )
        if not existing_contract:
            contract = Contract(
                project_id   = proposal.project_id,
                proposal_id  = proposal.id,
                client_id    = project.client_id,
                freelancer_id= proposal.freelancer_id,
                amount       = proposal.bid_amount,
                status       = "active",
                started_at   = datetime.utcnow(),
            )
            db.add(contract)

        # Reject all other pending/shortlisted proposals for this project
        (
            db.query(Proposal)
            .filter(
                Proposal.project_id == proposal.project_id,
                Proposal.id != proposal.id,
                Proposal.status.in_(["pending", "shortlisted"]),
            )
            .update({"status": "rejected", "updated_at": datetime.utcnow()},
                    synchronize_session=False)
        )

        # Mark project as in_progress
        project.status = "in_progress"

    db.commit()
    db.refresh(proposal)
    return proposal
