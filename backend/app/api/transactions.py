from fastapi import APIRouter, HTTPException, Query, Path
from typing import List, Optional

from db.transactions import (
    create_transaction,
    get_transaction_by_id,
    get_transactions_by_group_id,
    get_transactions_by_user_id,
    get_transactions_by_user_owed,
    get_transactions_by_user_owing,
    delete_transaction,
    update_transaction,
    get_transactions_by_group_id_and_user_id,
    get_transactions_by_user_owed_and_user_owing
)
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse
)

router = APIRouter()

@router.post("/", response_model=TransactionResponse)
async def create_transaction_endpoint(transaction: TransactionCreate):
    """Create a new transaction"""
    try:
        result = create_transaction(
            group_id=transaction.group_id,
            user_owed=transaction.user_owed,
            user_owing=transaction.user_owing,
            amount=transaction.amount
        )
        return TransactionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_endpoint(transaction_id: int = Path(..., description="Transaction ID")):
    """Get a transaction by ID"""
    result = get_transaction_by_id(transaction_id)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse(**result)

@router.get("/group/{group_id}", response_model=TransactionListResponse)
async def get_transactions_by_group_endpoint(group_id: str = Path(..., description="Group ID")):
    """Get all transactions for a group"""
    transactions = get_transactions_by_group_id(group_id)
    transaction_responses = [TransactionResponse(**transaction) for transaction in transactions]
    
    return TransactionListResponse(transactions=transaction_responses)

@router.get("/user/{user_id}", response_model=TransactionListResponse)
async def get_transactions_by_user_endpoint(user_id: str = Path(..., description="User ID")):
    """Get all transactions for a user"""
    transactions = get_transactions_by_user_id(user_id)
    transaction_responses = [TransactionResponse(**transaction) for transaction in transactions]
    
    return TransactionListResponse(transactions=transaction_responses)

@router.get("/user/{user_id}/owed", response_model=TransactionListResponse)
async def get_transactions_by_user_owed_endpoint(user_id: str = Path(..., description="User ID")):
    """Get all transactions where user is owed money"""
    transactions = get_transactions_by_user_owed(user_id)
    transaction_responses = [TransactionResponse(**transaction) for transaction in transactions]
    
    return TransactionListResponse(transactions=transaction_responses)

@router.get("/user/{user_id}/owing", response_model=TransactionListResponse)
async def get_transactions_by_user_owing_endpoint(user_id: str = Path(..., description="User ID")):
    """Get all transactions where user owes money"""
    transactions = get_transactions_by_user_owing(user_id)
    transaction_responses = [TransactionResponse(**transaction) for transaction in transactions]
    
    return TransactionListResponse(transactions=transaction_responses)

@router.get("/group/{group_id}/user/{user_id}", response_model=TransactionListResponse)
async def get_transactions_by_group_and_user_endpoint(
    group_id: str = Path(..., description="Group ID"),
    user_id: str = Path(..., description="User ID")
):
    """Get all transactions for a specific group and user"""
    transactions = get_transactions_by_group_id_and_user_id(group_id, user_id)
    transaction_responses = [TransactionResponse(**transaction) for transaction in transactions]
    
    return TransactionListResponse(transactions=transaction_responses)

@router.get("/user/{user_owed}/owing/{user_owing}", response_model=TransactionListResponse)
async def get_transactions_by_users_endpoint(
    user_owed: str = Path(..., description="User who is owed money"),
    user_owing: str = Path(..., description="User who owes money")
):
    """Get all transactions between two specific users"""
    transactions = get_transactions_by_user_owed_and_user_owing(user_owed, user_owing)
    transaction_responses = [TransactionResponse(**transaction) for transaction in transactions]
    
    return TransactionListResponse(transactions=transaction_responses)

@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction_endpoint(
    transaction_id: str = Path(..., description="Transaction ID"),
    transaction_update: TransactionUpdate = None
):
    """Update a transaction"""
    if not transaction_update:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Convert Pydantic model to dict, excluding None values
    updates = {k: v for k, v in transaction_update.dict().items() if v is not None}
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # Check if all required fields are provided for update
    required_fields = ["user_owed", "user_owing", "amount"]
    if not all(field in updates for field in required_fields):
        raise HTTPException(status_code=400, detail="All fields (user_owed, user_owing, amount) are required for update")
    
    success = update_transaction(
        transaction_id=transaction_id,
        user_owed=updates["user_owed"],
        user_owing=updates["user_owing"],
        amount=updates["amount"]
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found or update failed")
    
    # Return updated transaction
    result = get_transaction_by_id(int(transaction_id))
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found after update")
    
    return TransactionResponse(**result)

@router.delete("/{transaction_id}")
async def delete_transaction_endpoint(transaction_id: str = Path(..., description="Transaction ID")):
    """Delete a transaction"""
    success = delete_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found or deletion failed")
    
    return {"message": "Transaction deleted successfully"}

