from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import date

from app.constants import ExpenseCategory, EXPENSE_CATEGORIES

class BudgetCategory(BaseModel):
    """A single budget category with allocation and spending"""
    category: str  # Must match ExpenseCategory values
    allocated_amount: float  # Budgeted amount for this category
    spent_amount: float = 0.0  # Actual amount spent (calculated from expenses)
    percentage: float  # Percentage of total income allocated to this category
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v: str) -> str:
        """Validate that category is one of the allowed expense categories"""
        valid_categories = [cat.value for cat in EXPENSE_CATEGORIES]
        if v not in valid_categories:
            raise ValueError(f"Category must be one of: {', '.join(valid_categories)}")
        return v
    
    @field_validator('allocated_amount', 'spent_amount')
    @classmethod
    def validate_non_negative(cls, v: float) -> float:
        """Ensure amounts are non-negative"""
        if v < 0:
            raise ValueError("Amount must be non-negative")
        return v
    
    @field_validator('percentage')
    @classmethod
    def validate_percentage(cls, v: float) -> float:
        """Validate percentage is between 0 and 100"""
        if v < 0 or v > 100:
            raise ValueError("Percentage must be between 0 and 100")
        return v

class BudgetBase(BaseModel):
    """Base budget model"""
    name: str
    monthly_income: float
    savings_goal: float = 0.0
    categories: List[BudgetCategory]
    start_date: Optional[date] = None  # When this budget period starts
    end_date: Optional[date] = None  # When this budget period ends (optional for ongoing budgets)
    
    @field_validator('monthly_income', 'savings_goal')
    @classmethod
    def validate_non_negative(cls, v: float) -> float:
        """Ensure amounts are non-negative"""
        if v < 0:
            raise ValueError("Amount must be non-negative")
        return v

class BudgetCreate(BudgetBase):
    """Schema for creating a new budget"""
    template_id: Optional[str] = None  # Optional reference to a template used

class BudgetUpdate(BaseModel):
    """Schema for updating an existing budget"""
    name: Optional[str] = None
    monthly_income: Optional[float] = None
    savings_goal: Optional[float] = None
    categories: Optional[List[BudgetCategory]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    @field_validator('monthly_income', 'savings_goal')
    @classmethod
    def validate_non_negative(cls, v: Optional[float]) -> Optional[float]:
        """Ensure amounts are non-negative"""
        if v is not None and v < 0:
            raise ValueError("Amount must be non-negative")
        return v

class BudgetResponse(BudgetBase):
    """Schema for budget response"""
    id: str
    user_id: str
    template_id: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True

class BudgetListResponse(BaseModel):
    """Schema for listing budgets"""
    budgets: List[BudgetResponse]
    total: int

