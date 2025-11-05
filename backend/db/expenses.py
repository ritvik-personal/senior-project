from typing import Any, Dict, List, Optional, Tuple
from datetime import date, timedelta
import logging

from app.database import get_supabase_client, get_authenticated_client

logger = logging.getLogger(__name__)


TABLE_NAME = "expenses"


def _table():
    return get_supabase_client().table(TABLE_NAME)

def _authenticated_table(access_token: str):
    return get_authenticated_client(access_token).table(TABLE_NAME)

def _map_expense_fields(expense_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map database fields to schema fields"""
    return {
        "id": str(expense_data.get("expense_id", "")),  # Map expense_id to id, ensure string
        "user_id": expense_data.get("user_id"),
        "amount_dollars": expense_data.get("amount"),  # Map amount to amount_dollars
        "credit": expense_data.get("credit"),
        "category": expense_data.get("category"),
        "description": expense_data.get("notes"),  # Map notes to description
        "created_at": expense_data.get("created_at"),
        "updated_at": expense_data.get("updated_at"),  # Can be None, schema handles it
    }


def create_expense(
    user_id: str,
    amount_dollars: float,
    credit: bool,
    category: str,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    access_token: Optional[str] = None,
    created_at: Optional[date] = None,
    is_group_expense: bool = False,
    group_id: Optional[str] = None,
    participant_user_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "user_id": user_id,
        "credit": credit,
        "amount": amount_dollars,
        "category": category,
    }
    if description is not None:
        payload["notes"] = description
    if created_at is not None:
        # Store as ISO date string; backend column `created_at` can accept date/timestamp
        payload["created_at"] = created_at.isoformat()
    
    # Note: We don't store group_id in the expenses table
    # Group expenses are identified by the presence of related transactions
    
    # Skip metadata for now since column doesn't exist in schema
    # if metadata is not None:
    #     payload["metadata"] = metadata

    logger.debug("Inserting expense payload=%s", payload)
    
    # Use authenticated client if token is provided
    try:
        if access_token:
            resp = _authenticated_table(access_token).insert(payload).execute()
        else:
            resp = _table().insert(payload).execute()
    except Exception as e:
        logger.error(f"Error inserting expense: {e}")
        logger.error(f"Payload that failed: {payload}")
        # Try to extract error message from Supabase response
        error_msg = str(e)
        # Supabase exceptions may have different attributes
        if hasattr(e, 'message'):
            error_msg = e.message
        elif hasattr(e, 'args') and len(e.args) > 0:
            error_msg = str(e.args[0])
        raise RuntimeError(f"Failed to insert expense: {error_msg}")
        
    if resp.data:
        expense_data = resp.data[0]
        logger.debug("Database returned: %s", expense_data)
        
        # Extract expense_id from the created expense
        expense_id = expense_data.get("expense_id")
        
        # If this is a group expense, create transactions for expense splitting
        # Check if we have participants (not None and not empty list)
        has_participants = participant_user_ids is not None and len(participant_user_ids) > 0
        
        logger.debug(f"Group expense check: is_group_expense={is_group_expense}, group_id={group_id}, participant_user_ids={participant_user_ids}, has_participants={has_participants}")
        
        if is_group_expense and group_id and has_participants:
            try:
                from db.transactions import create_transaction
                
                # Calculate the amount each participant owes
                total_participants = len(participant_user_ids) + 1  # +1 for the expense creator
                amount_per_person = amount_dollars / total_participants
                
                logger.debug(f"Creating {len(participant_user_ids)} transactions for expense {expense_id}")
                
                # Create a transaction for each participant with the expense_id
                for participant_id in participant_user_ids:
                    create_transaction(
                        group_id=group_id,
                        user_owed=user_id,  # The expense creator is owed money
                        user_owing=participant_id,  # Each participant owes money
                        amount=amount_per_person,
                        notes=description,  # Pass the expense notes/description
                        expense_id=expense_id,  # Link transaction to expense for cascade
                        access_token=access_token  # Use authenticated client for RLS
                    )
                    logger.debug(f"Created transaction: {participant_id} owes {user_id} ${amount_per_person} for expense {expense_id}")
                    
            except Exception as e:
                logger.error(f"Failed to create transactions for group expense: {e}", exc_info=True)
                # Don't fail the expense creation if transaction creation fails
                # The expense should still be created even if splitting fails
        elif is_group_expense and group_id:
            logger.warning(f"Group expense created but no participants provided. Expense ID: {expense_id}, Group ID: {group_id}")
        
        return _map_expense_fields(expense_data)
    
    # If we get here, the insert didn't return data - check for error details
    error_msg = "Unknown error"
    if hasattr(resp, 'error') and resp.error:
        error_msg = resp.error
    elif hasattr(resp, 'message'):
        error_msg = resp.message
    logger.error(f"Failed to insert expense. Response: {resp}, Error: {error_msg}")
    raise RuntimeError(f"Failed to insert expense: {error_msg}")


def get_expense_by_category_and_user(category: str, user_id: str) -> Optional[Dict[str, Any]]:
    ##Change * depending on what we actually may need to work with.
    query = _table().select("*").eq(["category"], [category]).eq(["user_id"], [user_id])
    resp = query.single().execute()
    if resp.data:
        return _map_expense_fields(resp.data)
    return None

def get_expense_by_id(expense_id: str) -> Optional[Dict[str, Any]]:
    ##Change * depending on what we actually may need to work with.
    query = _table().select("*").eq(["expense_id"], [expense_id])  # Use expense_id instead of id
    resp = query.single().execute()
    if resp.data:
        return _map_expense_fields(resp.data)
    return None



def list_expenses(
    user_id: str,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    order_desc: bool = True,
    access_token: Optional[str] = None,
) -> List[Dict[str, Any]]:
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("*").eq("user_id", user_id)
    if category:
        query = query.eq("category", category)
    if start_date:
        query = query.gte("created_at", start_date.isoformat())
    if end_date:
        # Include entire end_date by using < (next day)
        inclusive_end = end_date + timedelta(days=1)
        query = query.lt("created_at", inclusive_end.isoformat())
    order_col = "created_at"
    query = query.order(order_col, desc=order_desc)
    if offset:
        query = query.range(offset, offset + max(0, limit - 1))
    else:
        query = query.limit(limit)
    resp = query.execute()
    if resp.data:
        expenses = [_map_expense_fields(expense) for expense in resp.data]
        
        # For each expense, check if it's a group expense and fetch participant info
        if access_token:
            try:
                from db.transactions import get_transactions_by_expense_id
                from app.database import get_authenticated_client
                
                supabase_client = get_authenticated_client(access_token)
                
                for expense in expenses:
                    expense_id = expense.get("id")
                    if expense_id:
                        # Check if this expense has transactions (group expense)
                        transactions = get_transactions_by_expense_id(expense_id)
                        if transactions:
                            expense["is_group_expense"] = True
                            
                            # Get unique participant user IDs from transactions
                            participant_ids = set()
                            group_id = None
                            for t in transactions:
                                user_owing = t.get("user_owing")
                                if user_owing:
                                    participant_ids.add(user_owing)
                                if not group_id:
                                    group_id = t.get("group_id")
                            
                            if participant_ids and group_id:
                                expense["group_id"] = group_id
                                expense["participant_user_ids"] = list(participant_ids)
                                
                                # Fetch emails for participants using RPC function
                                try:
                                    group_members_response = supabase_client.rpc('get_group_members_with_emails', {
                                        'target_group_id': group_id
                                    }).execute()
                                    
                                    if group_members_response.data:
                                        participant_emails = {}
                                        for member in group_members_response.data:
                                            member_id = member.get("user_id")
                                            email = member.get("email")
                                            if member_id in participant_ids and email:
                                                participant_emails[member_id] = email
                                        expense["participant_emails"] = participant_emails
                                except Exception as e:
                                    logger.error(f"Failed to fetch emails for expense {expense_id}: {e}")
                                    expense["participant_emails"] = {}
                        else:
                            expense["is_group_expense"] = False
            except Exception as e:
                logger.error(f"Error fetching participant info for expenses: {e}")
        
        return expenses
    return []


def update_expense(
    expense_id: str,
    updates: Dict[str, Any],
    access_token: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    # Get the current expense
    current_expense = get_expense_by_id(expense_id)
    if not current_expense:
        return None
    
    # Get the full expense data from database
    table = _authenticated_table(access_token) if access_token else _table()
    current_expense_db = table.select("*").eq("expense_id", expense_id).execute()
    if not current_expense_db.data:
        return None
    
    current_expense_data = current_expense_db.data[0]
    user_id = current_expense_data.get("user_id")
    
    # Check if this is a group expense by looking for related transactions
    # We don't store group_id in expenses table, so check transactions instead
    from db.transactions import get_transactions_by_expense_id
    existing_transactions = get_transactions_by_expense_id(expense_id)
    is_group_expense = len(existing_transactions) > 0
    
    # Get group_id from the first transaction if this is a group expense
    group_id = None
    if is_group_expense and existing_transactions:
        group_id = existing_transactions[0].get("group_id")
    
    # Extract participant_user_ids if provided
    participant_user_ids = updates.get("participant_user_ids")
    
    clean_updates: Dict[str, Any] = {}
    amount_changed = False
    description_changed = False
    participants_changed = False
    
    for key, value in updates.items():
        # Map API schema keys to DB columns
        if key == "amount_dollars":
            clean_updates["amount"] = value
            amount_changed = True
        elif key == "description":
            clean_updates["notes"] = value
            description_changed = True
        elif key in {"credit", "category"}:
            clean_updates[key] = value
        elif key == "created_at":
            if isinstance(value, date):
                clean_updates[key] = value.isoformat()
            elif isinstance(value, str):
                clean_updates[key] = value
        elif key == "participant_user_ids":
            # This is handled separately for transaction updates
            participants_changed = True

    # If this is a group expense, handle cascading updates to transactions
    if is_group_expense and group_id:
        try:
            from db.transactions import (
                delete_transactions_by_expense_id,
                update_transactions_by_expense_id,
                create_transaction
            )
            
            # If participants changed, delete old transactions and create new ones
            if participants_changed and participant_user_ids is not None:
                # Delete existing transactions
                delete_transactions_by_expense_id(expense_id, access_token=access_token)
                
                # Get the updated amount (use new amount if provided, otherwise current amount)
                new_amount = updates.get("amount_dollars", current_expense_data.get("amount", 0))
                total_participants = len(participant_user_ids) + 1  # +1 for the expense creator
                amount_per_person = new_amount / total_participants
                
                # Create new transactions with updated participants
                new_description = updates.get("description") or current_expense_data.get("notes")
                for participant_id in participant_user_ids:
                    create_transaction(
                        group_id=group_id,
                        user_owed=user_id,
                        user_owing=participant_id,
                        amount=amount_per_person,
                        notes=new_description,
                        expense_id=expense_id,
                        access_token=access_token
                    )
                    logger.debug(f"Updated transaction: {participant_id} owes {user_id} ${amount_per_person} for expense {expense_id}")
            
            # If only amount changed (and participants didn't change)
            elif amount_changed and not participants_changed and existing_transactions:
                # Calculate new amount per person based on existing participant count
                new_amount = updates.get("amount_dollars", current_expense_data.get("amount", 0))
                # Count unique participants from existing transactions
                unique_participants = set(t.get("user_owing") for t in existing_transactions if t.get("user_owing"))
                total_participants = len(unique_participants) + 1  # +1 for expense creator
                new_amount_per_person = new_amount / total_participants
                
                # Update all transactions with new amount (and description if it also changed)
                new_description = updates.get("description") if description_changed else None
                update_transactions_by_expense_id(expense_id, amount=new_amount_per_person, notes=new_description, access_token=access_token)
                logger.debug(f"Updated transaction amounts to ${new_amount_per_person} per person for expense {expense_id}")
            
            # If only description changed (and amount and participants didn't change)
            elif description_changed and not amount_changed and not participants_changed:
                new_description = updates.get("description")
                update_transactions_by_expense_id(expense_id, notes=new_description, access_token=access_token)
                logger.debug(f"Updated transaction notes for expense {expense_id}")
                
        except Exception as e:
            logger.error(f"Failed to update transactions for group expense: {e}")
            # Continue with expense update even if transaction update fails

    if not clean_updates:
        return get_expense_by_id(expense_id)

    try:
        resp = table.update(clean_updates).eq("expense_id", expense_id).execute()  # Use expense_id
        if resp.data:
            return _map_expense_fields(resp.data[0])
        return None
    except Exception as exc:
        logger.error("Update expense failed: %s", exc)
        return None


def delete_expense(
    expense_id: str,
    access_token: Optional[str] = None,
) -> bool:
    table = _authenticated_table(access_token) if access_token else _table()
    resp = table.delete().eq("expense_id", expense_id).execute()
    # If RLS disallows returning rows on delete, data may be None even when successful
    if isinstance(resp.data, list):
        return len(resp.data) > 0
    return True


def sum_expenses(
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    access_token: Optional[str] = None,
) -> int:
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("amount", head=False).eq("user_id", user_id)
    if start_date:
        query = query.gte("created_at", start_date.isoformat())
    if end_date:
        inclusive_end = end_date + timedelta(days=1)
        query = query.lt("created_at", inclusive_end.isoformat())
    if category:
        query = query.eq("category", category)
    resp = query.execute()
    rows = resp.data or []
    total = 0
    for row in rows:
        try:
            # amount may be float/decimal
            total += float(row.get("amount", 0))
        except (TypeError, ValueError):
            continue
    return total