from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional, List
from datetime import date

from db.expenses import (
    create_expense,
    get_expense_by_id,
    get_expense_by_category_and_user,
    list_expenses,
    update_expense,
    delete_expense,
    sum_expenses
)
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseListResponse
)

router = APIRouter()

@router.post("/", response_model=ExpenseResponse)
async def create_expense_endpoint(expense: ExpenseCreate):
    """Create a new expense"""
    try:
        result = create_expense(
            user_id=expense.user_id,
            amount_dollars=expense.amount_dollars,
            credit=expense.credit,
            category=expense.category,
            description=expense.description,
            metadata=expense.metadata
        )
        return ExpenseResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense_endpoint(expense_id: int = Path(..., description="Expense ID")):
    """Get an expense by ID"""
    result = get_expense_by_id(expense_id)
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found")
    return ExpenseResponse(**result)

@router.get("/category/{category}/user/{user_id}", response_model=ExpenseResponse)
async def get_expense_by_category_endpoint(
    category: str = Path(..., description="Expense category"),
    user_id: str = Path(..., description="User ID")
):
    """Get an expense by category and user"""
    result = get_expense_by_category_and_user(category, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found")
    return ExpenseResponse(**result)

@router.get("/", response_model=ExpenseListResponse)
async def list_expenses_endpoint(
    user_id: str = Query(..., description="User ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    limit: int = Query(100, ge=1, le=1000, description="Number of expenses to return"),
    offset: int = Query(0, ge=0, description="Number of expenses to skip"),
    order_desc: bool = Query(True, description="Order by created_at descending")
):
    """List expenses with optional filtering"""
    expenses = list_expenses(
        user_id=user_id,
        category=category,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
        order_desc=order_desc
    )
    
    expense_responses = [ExpenseResponse(**expense) for expense in expenses]
    
    return ExpenseListResponse(
        expenses=expense_responses,
        total=len(expense_responses),
        limit=limit,
        offset=offset
    )

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense_endpoint(
    expense_id: int = Path(..., description="Expense ID"),
    expense_update: ExpenseUpdate = None
):
    """Update an expense"""
    if not expense_update:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Convert Pydantic model to dict, excluding None values
    updates = {k: v for k, v in expense_update.dict().items() if v is not None}
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = update_expense(expense_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found or update failed")
    
    return ExpenseResponse(**result)

@router.delete("/{expense_id}")
async def delete_expense_endpoint(expense_id: int = Path(..., description="Expense ID")):
    """Delete an expense"""
    success = delete_expense(expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found or deletion failed")
    
    return {"message": "Expense deleted successfully"}

@router.get("/sum/total")
async def sum_expenses_endpoint(
    user_id: str = Query(..., description="User ID"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    """Get the sum of expenses with optional filtering"""
    total = sum_expenses(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        category=category
    )
    
    return {"total_amount": total, "user_id": user_id}

