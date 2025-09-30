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
    pass  # user_id will be extracted from JWT token

class ExpenseUpdate(BaseModel):
    amount_dollars: Optional[float] = None
    credit: Optional[bool] = None
    category: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ExpenseResponse(ExpenseBase):
    id: str  # Changed from int to str since database uses UUID
    user_id: str
    created_at: str
    updated_at: Optional[str] = None  # Made optional since it might be None

    class Config:
        from_attributes = True

class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: int
    limit: int
    offset: int

