from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import Optional, List
from datetime import date, datetime, timedelta

from db.expenses import (
    create_expense,
    get_expense_by_id,
    get_expense_by_category_and_user,
    list_expenses,
    update_expense,
    delete_expense,
    sum_expenses,
    sum_paycheck_expenses
)
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseListResponse
)
from app.utils.auth import get_current_user_id, get_access_token
from app.constants import ExpenseCategory

router = APIRouter()

@router.post("/", response_model=ExpenseResponse)
async def create_expense_endpoint(
    expense: ExpenseCreate,
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Create a new expense"""
    try:
        # If category is "Paycheck", explicitly set credit to True
        credit_value = expense.credit
        if expense.category == ExpenseCategory.PAYCHECK.value:
            credit_value = True
        
        result = create_expense(
            user_id=current_user_id,
            amount_dollars=expense.amount_dollars,
            credit=credit_value,
            category=expense.category,
            description=expense.description,
            metadata=expense.metadata,
            access_token=access_token,
            created_at=expense.created_at,
            is_group_expense=expense.is_group_expense,
            group_id=expense.group_id,
            participant_user_ids=expense.participant_user_ids
        )
        
        # If this is a group expense, fetch participant emails
        if expense.is_group_expense and expense.group_id and expense.participant_user_ids:
            try:
                from app.database import get_authenticated_client
                supabase_client = get_authenticated_client(access_token)
                
                group_members_response = supabase_client.rpc('get_group_members_with_emails', {
                    'target_group_id': expense.group_id
                }).execute()
                
                if group_members_response.data:
                    participant_emails = {}
                    for member in group_members_response.data:
                        member_id = member.get("user_id")
                        email = member.get("email")
                        if member_id in expense.participant_user_ids and email:
                            participant_emails[member_id] = email
                    result["participant_emails"] = participant_emails
                    result["is_group_expense"] = True
                    result["group_id"] = expense.group_id
                    result["participant_user_ids"] = expense.participant_user_ids
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to fetch participant emails: {e}")
        
        return ExpenseResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sum/total")
async def sum_expenses_endpoint(
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get the sum of expenses with optional filtering"""
    total = sum_expenses(
        user_id=current_user_id,
        start_date=start_date,
        end_date=end_date,
        category=category,
        access_token=access_token
    )
    
    return {"total_amount": total, "user_id": current_user_id}

@router.get("/sum/monthly")
async def sum_monthly_expenses_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get the sum of expenses for the current calendar month"""
    now = datetime.utcnow()
    # Start of current month
    start_of_month = date(year=now.year, month=now.month, day=1)
    # End date is today (current date)
    end_date = now.date()
    
    total = sum_expenses(
        user_id=current_user_id,
        start_date=start_of_month,
        end_date=end_date,
        category=None,
        access_token=access_token
    )
    return {"total_amount": total, "user_id": current_user_id}

@router.get("/sum/overall")
async def sum_overall_expenses_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get the sum of all expenses for the current user"""
    total = sum_expenses(user_id=current_user_id, access_token=access_token)
    return {"total_amount": total, "user_id": current_user_id}

@router.get("/sum/paycheck/monthly")
async def sum_paycheck_monthly_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get the sum of paycheck expenses for the current calendar month"""
    now = datetime.utcnow()
    # Start of current month
    start_of_month = date(year=now.year, month=now.month, day=1)
    # End date is today (current date)
    end_date = now.date()
    
    total = sum_paycheck_expenses(
        user_id=current_user_id,
        start_date=start_of_month,
        end_date=end_date,
        access_token=access_token
    )
    return {"total_amount": total, "user_id": current_user_id}

@router.get("/category/{category}", response_model=ExpenseResponse)
async def get_expense_by_category_endpoint(
    category: str = Path(..., description="Expense category"),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get an expense by category and user"""
    result = get_expense_by_category_and_user(category, current_user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found")
    return ExpenseResponse(**result)

@router.get("/", response_model=ExpenseListResponse)
async def list_expenses_endpoint(
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    limit: int = Query(100, ge=1, le=1000, description="Number of expenses to return"),
    offset: int = Query(0, ge=0, description="Number of expenses to skip"),
    order_desc: bool = Query(True, description="Order by created_at descending"),
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """List expenses with optional filtering"""
    expenses = list_expenses(
        user_id=current_user_id,
        category=category,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
        order_desc=order_desc,
        access_token=access_token
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
    expense_id: str = Path(..., description="Expense ID"),
    expense_update: ExpenseUpdate = None,
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Update an expense"""
    if not expense_update:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Convert Pydantic model to dict, excluding None values
    updates = {k: v for k, v in expense_update.dict().items() if v is not None}
    
    # If category is being updated to "Paycheck", explicitly set credit to True
    if "category" in updates and updates["category"] == ExpenseCategory.PAYCHECK.value:
        updates["credit"] = True
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = update_expense(
        expense_id,
        updates,
        access_token=access_token,
        current_user_id=current_user_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found or update failed")
    return ExpenseResponse(**result)

@router.delete("/{expense_id}")
async def delete_expense_endpoint(
    expense_id: str = Path(..., description="Expense ID"),
    access_token: str = Depends(get_access_token)
):
    """Delete an expense"""
    success = delete_expense(expense_id, access_token=access_token)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found or deletion failed")
    
    return {"message": "Expense deleted successfully"}

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense_endpoint(expense_id: str = Path(..., description="Expense ID")):
    """Get an expense by ID"""
    result = get_expense_by_id(expense_id)
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found")
    return ExpenseResponse(**result)

