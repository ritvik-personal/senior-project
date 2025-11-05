from pydantic import BaseModel
from typing import List, Optional

class TransactionBase(BaseModel):
    group_id: str
    user_owed: str
    user_owing: str
    amount: float
    notes: Optional[str] = None
    expense_id: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    user_owed: Optional[str] = None
    user_owing: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None
    expense_id: Optional[str] = None

class TransactionResponse(TransactionBase):
    transaction_id: str  # Changed from int to str since database uses UUID
    created_at: str
    updated_at: Optional[str] = None  # Made optional since it might be None

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
