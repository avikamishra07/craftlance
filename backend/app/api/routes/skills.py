import uuid
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.skill_verification import SkillVerification, BadgeLevel
from app.models.user import User
from app.schemas.skill import SkillVerificationOut, StartTestRequest, TestStartResponse, SubmitTestRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/skills", tags=["skills"])

# In-memory test session store — replace with Redis in production
_test_sessions: dict[str, dict] = {}

# Placeholder questions — AI generates these in Milestone 5
PLACEHOLDER_QUESTIONS = {
    "default": [
        {"q": "Which data structure uses LIFO order?", "options": ["Queue", "Stack", "Heap", "Tree"], "answer": 1},
        {"q": "What does REST stand for?", "options": ["Remote Execution State Transfer", "Representational State Transfer", "Resource Entity System Transfer", "None"], "answer": 1},
        {"q": "Which HTTP status code means 'Not Found'?", "options": ["200", "401", "404", "500"], "answer": 2},
        {"q": "What is a closure in JavaScript?", "options": ["A CSS property", "A function with access to its outer scope", "An event listener", "A database term"], "answer": 1},
        {"q": "Which SQL clause filters aggregated data?", "options": ["WHERE", "GROUP BY", "HAVING", "ORDER BY"], "answer": 2},
    ]
}


@router.get("/{user_id}", response_model=list[SkillVerificationOut])
def get_skill_verifications(user_id: str, db: Session = Depends(get_db)):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    return db.query(SkillVerification).filter(SkillVerification.user_id == uid, SkillVerification.passed == True).all()


@router.post("/test/start", response_model=TestStartResponse)
def start_skill_test(
    payload: StartTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    questions = PLACEHOLDER_QUESTIONS.get(payload.skill.lower(), PLACEHOLDER_QUESTIONS["default"])
    test_id = str(uuid.uuid4())
    _test_sessions[test_id] = {
        "user_id": str(current_user.id),
        "skill": payload.skill,
        "answers": [q["answer"] for q in questions],
    }
    return TestStartResponse(
        test_id=test_id,
        skill=payload.skill,
        questions=[{"q": q["q"], "options": q["options"]} for q in questions],
    )


@router.post("/test/submit", response_model=SkillVerificationOut)
def submit_skill_test(
    payload: SubmitTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _test_sessions.pop(payload.test_id, None)
    if not session or session["user_id"] != str(current_user.id):
        raise HTTPException(status_code=400, detail="Invalid or expired test session")

    correct = sum(1 for i, ans in enumerate(payload.answers) if i < len(session["answers"]) and ans == session["answers"][i])
    total = len(session["answers"])
    score = int((correct / total) * 100)
    passed = score >= 70

    badge_level = None
    if passed:
        badge_level = BadgeLevel.gold if score >= 90 else BadgeLevel.silver if score >= 80 else BadgeLevel.bronze

    # Upsert — update existing or create new
    existing = db.query(SkillVerification).filter(
        SkillVerification.user_id == current_user.id,
        SkillVerification.skill == session["skill"],
    ).first()

    if existing:
        existing.score = score
        existing.passed = passed
        existing.badge_level = badge_level
        existing.attempts += 1
        db.commit()
        db.refresh(existing)
        return existing

    verification = SkillVerification(
        user_id=current_user.id,
        skill=session["skill"],
        score=score,
        passed=passed,
        badge_level=badge_level,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)
    return verification
