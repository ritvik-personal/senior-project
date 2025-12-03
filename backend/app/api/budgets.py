from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import Optional, List
from datetime import date, datetime

from db.budgets import (
    create_budget,
    get_budget_by_id,
    list_budgets,
    update_budget,
    delete_budget
)
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetListResponse
)
from app.utils.auth import get_current_user_id, get_access_token

router = APIRouter()

def calculate_spent_amounts(budget: dict, user_id: str, access_token: str) -> dict:
    """
    Calculate spent amounts for each budget category based on actual expenses.
    This queries the expenses table and sums expenses by category for the budget period.
    """
    try:
        from db.expenses import sum_expenses
        
        # Get expenses for the budget period
        start_date_val = budget.get("start_date")
        end_date_val = budget.get("end_date")
        
        # Parse dates if they are strings
        start_date = None
        end_date = None
        
        if start_date_val:
            if isinstance(start_date_val, str):
                start_date = datetime.fromisoformat(start_date_val.replace('Z', '+00:00')).date()
            elif isinstance(start_date_val, date):
                start_date = start_date_val
        
        if end_date_val:
            if isinstance(end_date_val, str):
                end_date = datetime.fromisoformat(end_date_val.replace('Z', '+00:00')).date()
            elif isinstance(end_date_val, date):
                end_date = end_date_val
        
        # If no date range, calculate for current month
        if not start_date:
            now = datetime.utcnow()
            start_date = date(year=now.year, month=now.month, day=1)
            if now.month == 12:
                end_date = date(year=now.year, month=12, day=31)
            else:
                end_date = date(year=now.year, month=now.month + 1, day=1)
        
        # Update categories with spent amounts
        updated_categories = []
        for category_data in budget.get("categories", []):
            category_name = category_data.get("category")
            if category_name:
                # Sum expenses for this category in the budget period
                category_spent = sum_expenses(
                    user_id=user_id,
                    start_date=start_date,
                    end_date=end_date,
                    category=category_name,
                    access_token=access_token
                )
                category_data["spent_amount"] = float(category_spent)
            updated_categories.append(category_data)
        
        budget["categories"] = updated_categories
        return budget
    except Exception as e:
        # If calculation fails, return budget with original spent amounts (0)
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to calculate spent amounts: {e}")
        return budget

@router.post("/", response_model=BudgetResponse)
async def create_budget_endpoint(
    budget: BudgetCreate,
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Create a new budget"""
    try:
        # Convert categories to dict format for database storage
        categories_dict = [
            {
                "category": cat.category,
                "allocated_amount": cat.allocated_amount,
                "spent_amount": cat.spent_amount,
                "percentage": cat.percentage
            }
            for cat in budget.categories
        ]
        
        result = create_budget(
            user_id=current_user_id,
            name=budget.name,
            monthly_income=budget.monthly_income,
            savings_goal=budget.savings_goal,
            categories=categories_dict,
            template_id=budget.template_id,
            start_date=budget.start_date,
            end_date=budget.end_date,
            access_token=access_token
        )
        
        # Calculate spent amounts from actual expenses
        result = calculate_spent_amounts(result, current_user_id, access_token)
        
        return BudgetResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/savings-goal")
async def get_savings_goal_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get the savings goal from the user's most recent budget"""
    try:
        # Get the most recent budget for the user
        budgets = list_budgets(
            user_id=current_user_id,
            limit=1,
            offset=0,
            order_desc=True,
            access_token=access_token
        )
        
        if budgets and len(budgets) > 0:
            savings_goal = budgets[0].get("savings_goal", 0.0)
            return {"savings_goal": float(savings_goal)}
        else:
            # No budget found, return 0
            return {"savings_goal": 0.0}
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching savings goal: {e}")
        # Return 0 on error to avoid breaking the frontend
        return {"savings_goal": 0.0}

@router.get("/monthly-income")
async def get_monthly_income_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get monthly income: first from budget, then from paycheck expenses, then 0"""
    try:
        # First, try to get monthly_income from the most recent budget
        budgets = list_budgets(
            user_id=current_user_id,
            limit=1,
            offset=0,
            order_desc=True,
            access_token=access_token
        )
        
        if budgets and len(budgets) > 0:
            monthly_income = budgets[0].get("monthly_income", 0.0)
            if monthly_income and monthly_income > 0:
                return {"monthly_income": float(monthly_income)}
        
        # If no budget or monthly_income is 0, try to get from paycheck expenses
        from db.expenses import sum_paycheck_expenses
        from datetime import date, datetime
        
        now = datetime.utcnow()
        start_of_month = date(year=now.year, month=now.month, day=1)
        end_date = now.date()
        
        paycheck_total = sum_paycheck_expenses(
            user_id=current_user_id,
            start_date=start_of_month,
            end_date=end_date,
            access_token=access_token
        )
        
        if paycheck_total and paycheck_total > 0:
            return {"monthly_income": float(paycheck_total)}
        
        # If neither exists, return 0
        return {"monthly_income": 0.0}
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching monthly income: {e}")
        # Return 0 on error to avoid breaking the frontend
        return {"monthly_income": 0.0}

@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget_endpoint(
    budget_id: str = Path(..., description="Budget ID"),
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get a budget by ID"""
    result = get_budget_by_id(budget_id, access_token)
    if not result:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Verify ownership
    if result.get("user_id") != current_user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to view this budget")
    
    # Calculate spent amounts from actual expenses
    result = calculate_spent_amounts(result, current_user_id, access_token)
    
    return BudgetResponse(**result)

@router.get("/", response_model=BudgetListResponse)
async def list_budgets_endpoint(
    limit: int = Query(100, ge=1, le=1000, description="Number of budgets to return"),
    offset: int = Query(0, ge=0, description="Number of budgets to skip"),
    order_desc: bool = Query(True, description="Order by created_at descending"),
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """List budgets for the current user"""
    budgets = list_budgets(
        user_id=current_user_id,
        limit=limit,
        offset=offset,
        order_desc=order_desc,
        access_token=access_token
    )
    
    # Calculate spent amounts for each budget
    budgets_with_spending = []
    for budget in budgets:
        try:
            budget = calculate_spent_amounts(budget, current_user_id, access_token)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to calculate spending for budget {budget.get('id')}: {e}")
        budgets_with_spending.append(budget)
    
    budget_responses = [BudgetResponse(**budget) for budget in budgets_with_spending]
    
    return BudgetListResponse(
        budgets=budget_responses,
        total=len(budget_responses)
    )

@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget_endpoint(
    budget_id: str = Path(..., description="Budget ID"),
    budget_update: BudgetUpdate = None,
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Update a budget"""
    if not budget_update:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Convert Pydantic model to dict, excluding None values
    updates = {k: v for k, v in budget_update.dict().items() if v is not None}
    
    # Convert categories if provided
    if "categories" in updates and updates["categories"]:
        updates["categories"] = [
            {
                "category": cat.category,
                "allocated_amount": cat.allocated_amount,
                "spent_amount": cat.spent_amount,
                "percentage": cat.percentage
            }
            for cat in updates["categories"]
        ]
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = update_budget(
        budget_id,
        updates,
        access_token=access_token,
        current_user_id=current_user_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Budget not found or update failed")
    
    # Calculate spent amounts from actual expenses
    result = calculate_spent_amounts(result, current_user_id, access_token)
    
    return BudgetResponse(**result)

@router.delete("/{budget_id}")
async def delete_budget_endpoint(
    budget_id: str = Path(..., description="Budget ID"),
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Delete a budget"""
    success = delete_budget(budget_id, access_token=access_token, current_user_id=current_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found or deletion failed")
    
    return {"message": "Budget deleted successfully"}

@router.get("/categories/list", response_model=List[dict])
async def get_categories_endpoint():
    """Get available expense/budget categories with metadata"""
    from app.constants import EXPENSE_CATEGORIES, CATEGORY_INFO
    
    return [
        {
            "id": category.value,
            "name": category.value,
            "icon": CATEGORY_INFO.get(category, {}).get("icon", "📦"),
            "color": CATEGORY_INFO.get(category, {}).get("color", "bg-gray-100 text-gray-800")
        }
        for category in EXPENSE_CATEGORIES
    ]

