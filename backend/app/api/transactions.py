from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import List, Optional, Dict
import logging

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
    get_transactions_by_user_owed_and_user_owing,
    get_grouped_transactions_for_user
)
from db.groups import get_user_groups
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse
)
from app.utils.auth import get_current_user_id, get_access_token

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=TransactionResponse)
async def create_transaction_endpoint(transaction: TransactionCreate):
    """Create a new transaction"""
    try:
        result = create_transaction(
            group_id=transaction.group_id,
            user_owed=transaction.user_owed,
            user_owing=transaction.user_owing,
            amount=transaction.amount,
            notes=transaction.notes
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
        amount=updates["amount"],
        notes=updates.get("notes")
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

@router.get("/settlements/me")
async def get_transactions_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """
    Get grouped transactions for the current user across all their groups.
    Groups transactions that occurred within 1 second with the same user_owed.
    Returns user balance and all transactions organized by group.
    """
    try:
        # Get all groups the user is in
        user_groups = get_user_groups(current_user_id, access_token)
        
        if not user_groups:
            return {
                "transactions": [],
                "transactions_by_group": {},
                "user_balance": 0.0,
                "total_owed": 0.0,
                "total_owing": 0.0,
                "groups": []
            }
        
        # Extract group IDs
        group_ids = [group.get("group_id") for group in user_groups if group.get("group_id")]
        
        # Get grouped transactions
        result = get_grouped_transactions_for_user(current_user_id, group_ids)
        
        # Collect unique user IDs to fetch emails
        unique_user_ids = set()
        for trans in result.get("transactions", []):
            unique_user_ids.add(trans.get("user_owed"))
            unique_user_ids.update(trans.get("user_owing_list", []))
        
        logger.info(f"Found unique user IDs: {unique_user_ids}")
        
        # Fetch user emails using RPC function (same approach as groups module)
        user_emails: Dict[str, str] = {}
        if unique_user_ids and access_token:
            try:
                from app.database import get_authenticated_client
                
                user_ids_list = list(unique_user_ids)
                logger.info(f"Fetching emails for user IDs: {user_ids_list}")
                
                # Use authenticated client
                supabase_client = get_authenticated_client(access_token)
                
                # Use the existing RPC function that works (get_group_members_with_emails)
                # We'll call it for each group and collect all unique emails
                logger.info("Using existing RPC function get_group_members_with_emails")
                
                # Get all groups the user is in to collect emails from all group members
                all_emails = {}
                for group in user_groups:
                    group_id = group.get("group_id")
                    if group_id:
                        try:
                            logger.info(f"Getting emails for group {group_id}")
                            group_members_response = supabase_client.rpc('get_group_members_with_emails', {
                                'target_group_id': group_id
                            }).execute()
                            
                            if group_members_response.data:
                                for member in group_members_response.data:
                                    user_id = member.get("user_id")
                                    email = member.get("email")
                                    if user_id and email:
                                        all_emails[user_id] = email
                                        
                        except Exception as group_error:
                            logger.warning(f"Failed to get emails for group {group_id}: {group_error}")
                
                # Filter to only include the user IDs we need
                user_emails = {user_id: email for user_id, email in all_emails.items() if user_id in user_ids_list}
                logger.info(f"Fetched emails for {len(user_emails)} users: {user_emails}")
                        
            except Exception as e:
                logger.error(f"Error fetching user emails: {e}")
                # Continue without emails - frontend will fallback to user IDs
        else:
            logger.warning(f"No access token or unique user IDs. Token exists: {bool(access_token)}, User IDs: {unique_user_ids}")
        
        # Add group information and emails to the result
        result["groups"] = user_groups
        result["user_emails"] = user_emails
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")

