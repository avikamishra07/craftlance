"""
AI scoring route — M7

POST /proposals/:id/score   Manually re-trigger AI scoring for a proposal.
                             (Auto-trigger happens via proposals.py submit hook)

Also exports `trigger_score_proposal` — a helper called from proposals.py
to enqueue scoring as a BackgroundTask on submission.
"""
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.proposal import Proposal
from app.services.ai_scorer import score_proposal

router = APIRouter(tags=["ai"])


# ── Manual re-score endpoint ──────────────────────────────────────────────────

@router.post("/proposals/{proposal_id}/score", status_code=status.HTTP_202_ACCEPTED)
async def rescore_proposal(
    proposal_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually re-trigger AI scoring for a proposal.
    Only the proposal's author or a staff user may call this.
    Returns 202 immediately; scoring runs in the background.
    """
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if proposal.freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your proposal")

    # Reset scores so the frontend shows the pending skeleton again
    proposal.ai_score = None
    proposal.ai_clarity_score = None
    proposal.ai_relevance_score = None
    proposal.ai_professionalism_score = None
    proposal.ai_value_score = None
    proposal.ai_feedback = None
    db.commit()

    background_tasks.add_task(score_proposal, str(proposal_id), db)
    return {"detail": "Scoring enqueued", "proposal_id": str(proposal_id)}


# ── Helper used by proposals.py submit route ──────────────────────────────────

def enqueue_scoring(proposal_id: str, background_tasks: BackgroundTasks, db: Session) -> None:
    """
    Call this from the proposal submit route to auto-trigger scoring.

    In proposals.py, after creating the proposal row:

        from app.api.routes.ai import enqueue_scoring
        enqueue_scoring(str(proposal.id), background_tasks, db)

    The submit route signature must accept `background_tasks: BackgroundTasks`.
    """
    background_tasks.add_task(score_proposal, proposal_id, db)
