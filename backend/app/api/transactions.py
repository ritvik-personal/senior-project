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
async def create_transaction_endpoint(
    transaction: TransactionCreate,
    access_token: str = Depends(get_access_token),
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a new transaction"""
    try:
        result = create_transaction(
            group_id=transaction.group_id,
            user_owed=transaction.user_owed,
            user_owing=transaction.user_owing,
            amount=transaction.amount,
            notes=transaction.notes,
            expense_id=transaction.expense_id,
            access_token=access_token
        )
        
        # If this is a settlement transaction, create expense entries for both parties
        # We use a database function that bypasses RLS to avoid policy complexity
        if transaction.notes and transaction.notes.lower() == "settlement":
            try:
                from app.constants import ExpenseCategory
                from datetime import date
                from app.database import get_authenticated_client
                
                # Get authenticated Supabase client
                supabase_client = get_authenticated_client(access_token)
                
                # Transaction structure: user_owed = payer, user_owing = recipient
                # 1. Create expense for the payer (user_owed) - this is a cost/expense (credit=false)
                try:
                    payer_result = supabase_client.rpc('create_settlement_expense', {
                        'p_user_id': transaction.user_owed,
                        'p_amount': transaction.amount,
                        'p_credit': False,
                        'p_category': ExpenseCategory.SETTLEMENT.value,
                        'p_notes': 'Settlement paid to group member',
                        'p_created_at': date.today().isoformat(),
                        'p_authenticated_user_id': current_user_id
                    }).execute()
                    logger.info(f"Created settlement expense (debit) for payer {transaction.user_owed}")
                except Exception as payer_expense_error:
                    logger.warning(f"Failed to create settlement expense for payer {transaction.user_owed}: {payer_expense_error}")
                
                # 2. Create expense for the recipient (user_owing) - this is income (credit=true)
                try:
                    recipient_result = supabase_client.rpc('create_settlement_expense', {
                        'p_user_id': transaction.user_owing,
                        'p_amount': transaction.amount,
                        'p_credit': True,
                        'p_category': ExpenseCategory.SETTLEMENT.value,
                        'p_notes': 'Settlement received from group transaction',
                        'p_created_at': date.today().isoformat(),
                        'p_authenticated_user_id': current_user_id
                    }).execute()
                    logger.info(f"Successfully created settlement expense (credit) for recipient {transaction.user_owing}")
                except Exception as recipient_expense_error:
                    logger.error(f"Failed to create settlement expense for recipient {transaction.user_owing}: {recipient_expense_error}")
                    logger.error(f"Payer user_id: {transaction.user_owed}, Recipient user_id: {transaction.user_owing}")
                    
            except Exception as expense_error:
                # If expense creation fails, log it but don't fail the transaction
                logger.warning(f"Failed to create settlement expenses: {expense_error}")
                # Transaction creation still succeeds even if expense creation fails
        
        return TransactionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_endpoint(transaction_id: str = Path(..., description="Transaction ID")):
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
    result = get_transaction_by_id(transaction_id)
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
        
        # Get grouped transactions (pass access_token for RLS)
        result = get_grouped_transactions_for_user(current_user_id, group_ids, access_token)
        
        # Collect unique user IDs to fetch emails
        unique_user_ids = set()
        # Always include the current user
        if current_user_id:
            unique_user_ids.add(current_user_id)
        
        # Extract user IDs from transactions
        transactions_list = result.get("transactions", [])
        logger.info(f"Processing {len(transactions_list)} transactions")
        
        for trans in transactions_list:
            # Add user_owed if it exists and is not None
            user_owed = trans.get("user_owed")
            if user_owed and isinstance(user_owed, str) and user_owed.strip():
                unique_user_ids.add(user_owed)
            
            # Add all users from user_owing_list if it exists
            user_owing_list = trans.get("user_owing_list", [])
            if isinstance(user_owing_list, list):
                for user_id in user_owing_list:
                    if user_id and isinstance(user_id, str) and user_id.strip():
                        unique_user_ids.add(user_id)
        
        logger.info(f"Found unique user IDs: {unique_user_ids} (count: {len(unique_user_ids)})")
        
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

