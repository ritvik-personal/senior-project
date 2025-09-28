from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import date

class ExpenseBase(BaseModel):
    amount_dollars: float
    credit: bool
    category: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ExpenseCreate(ExpenseBase):
    user_id: str

class ExpenseUpdate(BaseModel):
    amount_dollars: Optional[float] = None
    credit: Optional[bool] = None
    category: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ExpenseResponse(ExpenseBase):
    id: int
    user_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: int
    limit: int
    offset: int

