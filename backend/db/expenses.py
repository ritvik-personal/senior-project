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
    # Skip metadata for now since column doesn't exist in schema
    # if metadata is not None:
    #     payload["metadata"] = metadata

    logger.debug("Inserting expense payload=%s", payload)
    
    # Use authenticated client if token is provided
    if access_token:
        resp = _authenticated_table(access_token).insert(payload).execute()
    else:
        resp = _table().insert(payload).execute()
        
    if resp.data:
        expense_data = resp.data[0]
        logger.debug("Database returned: %s", expense_data)
        
        # If this is a group expense, create transactions for expense splitting
        if is_group_expense and group_id and participant_user_ids:
            try:
                from db.transactions import create_transaction
                
                # Calculate the amount each participant owes
                total_participants = len(participant_user_ids) + 1  # +1 for the expense creator
                amount_per_person = amount_dollars / total_participants
                
                # Create a transaction for each participant
                for participant_id in participant_user_ids:
                    create_transaction(
                        group_id=group_id,
                        user_owed=user_id,  # The expense creator is owed money
                        user_owing=participant_id,  # Each participant owes money
                        amount=amount_per_person
                    )
                    logger.debug(f"Created transaction: {participant_id} owes {user_id} ${amount_per_person}")
                    
            except Exception as e:
                logger.error(f"Failed to create transactions for group expense: {e}")
                # Don't fail the expense creation if transaction creation fails
                # The expense should still be created even if splitting fails
        
        return _map_expense_fields(expense_data)
    raise RuntimeError(f"Failed to insert expense: {resp}")


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
        return [_map_expense_fields(expense) for expense in resp.data]
    return []


def update_expense(
    expense_id: str,
    updates: Dict[str, Any],
    access_token: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    clean_updates: Dict[str, Any] = {}
    for key, value in updates.items():
        # Map API schema keys to DB columns
        if key == "amount_dollars":
            clean_updates["amount"] = value
        elif key == "description":
            clean_updates["notes"] = value
        elif key in {"credit", "category"}:
            clean_updates[key] = value
        elif key == "created_at":
            if isinstance(value, date):
                clean_updates[key] = value.isoformat()
            elif isinstance(value, str):
                clean_updates[key] = value

    if not clean_updates:
        return get_expense_by_id(expense_id)

    table = _authenticated_table(access_token) if access_token else _table()
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