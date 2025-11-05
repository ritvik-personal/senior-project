from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import date

class ExpenseBase(BaseModel):
    amount_dollars: float
    credit: bool
    category: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ExpenseCreate(ExpenseBase):
    # Optional: allow client to set created_at (e.g., from a date picker)
    created_at: Optional[date] = None  # user_id will be extracted from JWT token
    
    # Group expense fields
    is_group_expense: Optional[bool] = False
    group_id: Optional[str] = None
    participant_user_ids: Optional[List[str]] = []

class ExpenseUpdate(BaseModel):
    amount_dollars: Optional[float] = None
    credit: Optional[bool] = None
    category: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[date] = None
    # Group expense fields for editing
    participant_user_ids: Optional[List[str]] = None

class ExpenseResponse(ExpenseBase):
    id: str  # Changed from int to str since database uses UUID
    user_id: str
    created_at: str
    updated_at: Optional[str] = None  # Made optional since it might be None
    # Group expense fields
    is_group_expense: Optional[bool] = False
    group_id: Optional[str] = None
    participant_user_ids: Optional[List[str]] = None
    participant_emails: Optional[Dict[str, str]] = None  # Maps user_id to email

    class Config:
        from_attributes = True

class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: int
    limit: int
    offset: int

