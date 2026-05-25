"""
AI Proposal Scorer — M7

Calls the Anthropic API to score a proposal's cover letter against the
project description across four dimensions (0–100 each):
  - clarity:         how clearly the freelancer communicates their approach
  - relevance:       how well the cover letter addresses the project requirements
  - professionalism: tone, structure, grammar, and presentation
  - value:           whether the proposed bid and timeline seem reasonable

Writes results back to the proposal row.
Never raises — on any error the proposal row stays as-is (ai_score stays null).
"""
import json
import logging
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.proposal import Proposal

logger = logging.getLogger(__name__)

ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """\
You are an expert freelance marketplace evaluator. You score proposals written
by freelancers in response to a client's project description.

You MUST respond with a single valid JSON object and nothing else — no markdown
fences, no explanation, no preamble. The JSON must have exactly these keys:

{
  "clarity":         <integer 0-100>,
  "relevance":       <integer 0-100>,
  "professionalism": <integer 0-100>,
  "value":           <integer 0-100>,
  "overall":         <integer 0-100>,
  "feedback":        "<2-3 sentence summary of strengths and one concrete improvement tip>"
}

Scoring guide:
- clarity (0-100):         Is the approach clearly explained? Is it easy to understand?
- relevance (0-100):       Does the cover letter directly address the project requirements and skills needed?
- professionalism (0-100): Is the tone professional? Are there grammar/spelling issues? Is it well-structured?
- value (0-100):           Does the proposed bid and timeline seem reasonable given the project scope?
- overall (0-100):         Holistic score — weighted average with your own judgment applied.
"""


def _build_user_prompt(
    project_title: str,
    project_description: str,
    required_skills: list[str],
    budget_min: int,
    budget_max: int,
    cover_letter: str,
    bid_amount: int,
    timeline_days: int,
) -> str:
    skills_str = ", ".join(required_skills) if required_skills else "Not specified"
    return f"""\
## Project
Title: {project_title}
Description: {project_description}
Required skills: {skills_str}
Budget: ${budget_min:,} – ${budget_max:,}

## Proposal
Cover letter:
{cover_letter}

Bid amount: ${bid_amount:,}
Proposed timeline: {timeline_days} day(s)

Score this proposal now."""


async def score_proposal(proposal_id: str, db: Session) -> None:
    """
    Background task entry point.
    Fetches proposal + project, calls Claude, writes scores back.
    Never raises — all exceptions are caught and logged.
    """
    try:
        await _score(proposal_id, db)
    except Exception as exc:
        logger.error("ai_scorer: unhandled error for proposal %s: %s", proposal_id, exc, exc_info=True)


async def _score(proposal_id: str, db: Session) -> None:
    from app.models.project import Project  # local import to avoid circular

    proposal: Optional[Proposal] = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        logger.warning("ai_scorer: proposal %s not found", proposal_id)
        return

    project: Optional[Project] = db.query(Project).filter(Project.id == proposal.project_id).first()
    if not project:
        logger.warning("ai_scorer: project %s not found for proposal %s", proposal.project_id, proposal_id)
        return

    api_key: Optional[str] = getattr(settings, "ANTHROPIC_API_KEY", None)
    if not api_key:
        logger.warning("ai_scorer: ANTHROPIC_API_KEY not set — skipping scoring")
        return

    user_prompt = _build_user_prompt(
        project_title=project.title,
        project_description=project.description,
        required_skills=project.required_skills or [],
        budget_min=project.budget_min,
        budget_max=project.budget_max,
        cover_letter=proposal.cover_letter,
        bid_amount=proposal.bid_amount,
        timeline_days=proposal.timeline_days,
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ANTHROPIC_MESSAGES_URL,
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": MODEL,
                    "max_tokens": 512,
                    "system": SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.error("ai_scorer: HTTP error calling Anthropic for proposal %s: %s", proposal_id, exc)
        return

    try:
        body = response.json()
        raw_text: str = body["content"][0]["text"].strip()
        scores = json.loads(raw_text)
    except (KeyError, IndexError, json.JSONDecodeError, ValueError) as exc:
        logger.error("ai_scorer: failed to parse Anthropic response for proposal %s: %s", proposal_id, exc)
        return

    # Clamp all scores to 0–100 defensively
    def _clamp(v) -> Optional[int]:
        try:
            return max(0, min(100, int(v)))
        except (TypeError, ValueError):
            return None

    proposal.ai_clarity_score        = _clamp(scores.get("clarity"))
    proposal.ai_relevance_score      = _clamp(scores.get("relevance"))
    proposal.ai_professionalism_score = _clamp(scores.get("professionalism"))
    proposal.ai_value_score          = _clamp(scores.get("value"))
    proposal.ai_score                = _clamp(scores.get("overall"))
    proposal.ai_feedback             = str(scores.get("feedback", ""))[:1000]

    db.commit()
    logger.info(
        "ai_scorer: scored proposal %s — overall=%s clarity=%s relevance=%s professionalism=%s value=%s",
        proposal_id,
        proposal.ai_score,
        proposal.ai_clarity_score,
        proposal.ai_relevance_score,
        proposal.ai_professionalism_score,
        proposal.ai_value_score,
    )
