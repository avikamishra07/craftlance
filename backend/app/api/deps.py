import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def require_freelancer(current_user: User = Depends(get_current_user)) -> User:
    from app.models.user import UserRole
    if current_user.role not in (UserRole.freelancer, UserRole.both):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Freelancer access required")
    return current_user


def require_client(current_user: User = Depends(get_current_user)) -> User:
    from app.models.user import UserRole
    if current_user.role not in (UserRole.client, UserRole.both):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client access required")
    return current_user
