import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.portfolio import PortfolioItem
from app.models.user import User
from app.schemas.portfolio import PortfolioItemCreate, PortfolioItemUpdate, PortfolioItemOut
from app.api.deps import get_current_user, require_freelancer

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/{user_id}", response_model=list[PortfolioItemOut])
def get_portfolio(user_id: str, db: Session = Depends(get_db)):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    return db.query(PortfolioItem).filter(PortfolioItem.user_id == uid).all()


@router.post("", response_model=PortfolioItemOut, status_code=status.HTTP_201_CREATED)
def create_portfolio_item(
    payload: PortfolioItemCreate,
    current_user: User = Depends(require_freelancer),
    db: Session = Depends(get_db),
):
    item = PortfolioItem(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=PortfolioItemOut)
def update_portfolio_item(
    item_id: str,
    payload: PortfolioItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    item = db.query(PortfolioItem).filter(
        PortfolioItem.id == iid, PortfolioItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    item = db.query(PortfolioItem).filter(
        PortfolioItem.id == iid, PortfolioItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    db.delete(item)
    db.commit()
