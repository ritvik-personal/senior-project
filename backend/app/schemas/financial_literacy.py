from pydantic import BaseModel
from typing import Optional

class FinancialLiteracyQuery(BaseModel):
    """Schema for financial literacy chat query"""
    query: str
    user_id: Optional[str] = None

class FinancialLiteracyResponse(BaseModel):
    """Schema for financial literacy chat response"""
    answer: str
    sources: Optional[list[str]] = None


