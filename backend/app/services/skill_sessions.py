"""
In-memory test session store — M8

Holds active (started but not yet submitted) test sessions so that:
- The server can verify answers at submission time
- Timer expiry is enforced server-side

Sessions are keyed by test_id (UUID string).  Expired / submitted sessions
are cleaned up on access (lazy expiry).

For a production deployment, replace this with a Redis cache.
"""
from __future__ import annotations
import uuid
import time
from dataclasses import dataclass, field
from typing import Optional

TEST_DURATION_SECONDS = 20 * 60   # 20 minutes


@dataclass
class TestSession:
    test_id:     str
    user_id:     str
    skill_key:   str
    questions:   list[dict]        # list of grading dicts (includes correct_index)
    started_at:  float = field(default_factory=time.time)

    @property
    def expires_at(self) -> float:
        return self.started_at + TEST_DURATION_SECONDS

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at

    @property
    def seconds_remaining(self) -> int:
        return max(0, int(self.expires_at - time.time()))


_sessions: dict[str, TestSession] = {}


def create_session(user_id: str, skill_key: str, questions: list[dict]) -> str:
    test_id = str(uuid.uuid4())
    _sessions[test_id] = TestSession(
        test_id=test_id,
        user_id=user_id,
        skill_key=skill_key,
        questions=questions,
    )
    return test_id


def get_session(test_id: str) -> Optional[TestSession]:
    session = _sessions.get(test_id)
    if session is None:
        return None
    if session.is_expired:
        del _sessions[test_id]
        return None
    return session


def delete_session(test_id: str) -> None:
    _sessions.pop(test_id, None)


def grade_session(session: TestSession, answers: dict[str, int]) -> dict:
    """
    Grade a session.

    `answers` is {str(question_index): chosen_option_index}.

    Returns a grading result dict.
    """
    correct = 0
    total   = len(session.questions)
    per_question = []

    for q in session.questions:
        idx = str(q["index"])
        chosen = answers.get(idx)
        is_correct = (chosen == q["correct_index"])
        if is_correct:
            correct += 1
        per_question.append({
            "index":         q["index"],
            "chosen":        chosen,
            "correct_index": q["correct_index"],
            "correct":       is_correct,
        })

    score_pct = round((correct / total) * 100, 1) if total else 0

    badge = None
    if score_pct >= 90:
        badge = "gold"
    elif score_pct >= 75:
        badge = "silver"
    elif score_pct >= 60:
        badge = "bronze"

    return {
        "correct":     correct,
        "total":       total,
        "score_pct":   score_pct,
        "badge":       badge,
        "per_question": per_question,
    }
