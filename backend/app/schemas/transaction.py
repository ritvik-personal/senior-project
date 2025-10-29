from pydantic import BaseModel
from typing import List, Optional

class TransactionBase(BaseModel):
    group_id: str
    user_owed: str
    user_owing: str
    amount: float
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    user_owed: Optional[str] = None
    user_owing: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None

class TransactionResponse(TransactionBase):
    transaction_id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
