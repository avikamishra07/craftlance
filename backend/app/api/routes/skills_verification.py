"""
Skill Verification routes — M8

GET  /skills/tests                    List available skill tests
POST /skills/tests/:skill/start       Start a timed test (returns 20 MCQs + test_id)
POST /skills/tests/:testId/submit     Grade answers, persist SkillVerification, award badge
GET  /skills/verified                 My verified skills
"""
import time
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.skill_verification import SkillVerification
from app.schemas.skills import (
    SkillCatalogueItem,
    TestStartResponse,
    QuestionOut,
    TestSubmitRequest,
    TestSubmitResponse,
    VerifiedSkillOut,
)
from app.services.skill_catalogue import get_all_skills, get_skill
from app.services.skill_sessions import (
    TEST_DURATION_SECONDS,
    create_session,
    get_session,
    delete_session,
    grade_session,
)

router = APIRouter(prefix="/skills", tags=["skills"])


# ── GET /skills/tests ──────────────────────────────────────────────────────────

@router.get("/tests", response_model=list[SkillCatalogueItem])
def list_skill_tests():
    """Return the hard-coded catalogue of available skill tests."""
    return get_all_skills()


# ── POST /skills/tests/:skill/start ───────────────────────────────────────────

@router.post("/tests/{skill_key}/start", response_model=TestStartResponse)
def start_skill_test(
    skill_key:    str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Start a timed skill test.  Returns 20 randomly-sampled questions and a
    test_id that must be passed to the submit endpoint.
    """
    skill = get_skill(skill_key)
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_key}' not found")

    sampled      = skill.sample_20()
    client_qs    = [q.to_client_dict(i) for i, q in enumerate(sampled)]
    grading_qs   = [q.to_grading_dict(i) for i, q in enumerate(sampled)]

    test_id = create_session(str(current_user.id), skill_key, grading_qs)

    return TestStartResponse(
        test_id          = test_id,
        skill_key        = skill.key,
        skill_label      = skill.label,
        questions        = [QuestionOut(**q) for q in client_qs],
        duration_seconds = TEST_DURATION_SECONDS,
        started_at       = time.time(),
    )


# ── POST /skills/tests/:testId/submit ─────────────────────────────────────────

@router.post("/tests/{test_id}/submit", response_model=TestSubmitResponse)
def submit_skill_test(
    test_id:  str,
    payload:  TestSubmitRequest,
    db:       Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Grade the submitted answers, persist a SkillVerification row, award badge.
    """
    session = get_session(test_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Test session not found or has expired. Please start a new test.",
        )

    # Ensure this is the same user who started the test
    if session.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your test session")

    skill = get_skill(session.skill_key)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    time_taken_s = int(time.time() - session.started_at)
    result       = grade_session(session, payload.answers)

    completed_at = datetime.utcnow()

    # Persist to DB
    verification = SkillVerification(
        user_id      = current_user.id,
        skill_key    = session.skill_key,
        skill_label  = skill.label,
        score_pct    = result["score_pct"],
        correct      = result["correct"],
        total        = result["total"],
        time_taken_s = time_taken_s,
        badge_level  = result["badge"],
        answers      = payload.answers,
        completed_at = completed_at,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    # Clean up session
    delete_session(test_id)

    return TestSubmitResponse(
        verification_id = str(verification.id),
        skill_key       = session.skill_key,
        skill_label     = skill.label,
        score_pct       = result["score_pct"],
        correct         = result["correct"],
        total           = result["total"],
        badge           = result["badge"],
        time_taken_s    = time_taken_s,
        completed_at    = completed_at,
    )


# ── GET /skills/verified ──────────────────────────────────────────────────────

@router.get("/verified", response_model=list[VerifiedSkillOut])
def get_my_verified_skills(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Return all verified skill records for the current user."""
    verifications = (
        db.query(SkillVerification)
        .filter(
            SkillVerification.user_id == current_user.id,
            SkillVerification.badge_level.isnot(None),
        )
        .order_by(SkillVerification.completed_at.desc())
        .all()
    )
    return [
        VerifiedSkillOut(
            id           = str(v.id),
            skill_key    = v.skill_key,
            skill_label  = v.skill_label,
            score_pct    = v.score_pct,
            badge_level  = v.badge_level,
            completed_at = v.completed_at,
        )
        for v in verifications
    ]
