from typing import Any, Dict, List, Optional, Tuple
from datetime import date
import logging

from app.database import get_supabase_client

logger = logging.getLogger(__name__)


TABLE_NAME = "expenses"


def _table():
    return get_supabase_client().table(TABLE_NAME)


def create_expense(
    user_id: str,
    amount_dollars: float,
    credit: bool,
    category: str,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "user_id": user_id,
        "credit": credit,
        "amount": amount_dollars,
        "category": category,
    }
    if description is not None:
        payload["notes"] = description
    if metadata is not None:
        payload["metadata"] = metadata

    logger.debug("Inserting expense payload=%s", payload)
    resp = _table().insert(payload).select("*").execute()
    if resp.data:
        return resp.data[0]
    raise RuntimeError(f"Failed to insert expense: {resp}")


def get_expense_by_category_and_user(category: str, user_id: str) -> Optional[Dict[str, Any]]:
    ##Change * depending on what we actually may need to work with.
    query = _table().select("*").eq(["category"], [category]).eq(["user_id"], [user_id])
    resp = query.single().execute()
    return resp.data

def get_expense_by_id(expense_id: int) -> Optional[Dict[str, Any]]:
    ##Change * depending on what we actually may need to work with.
    query = _table().select("*").eq(["id"], [expense_id])
    resp = query.single().execute()
    return resp.data



def list_expenses(
    user_id: str,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    order_desc: bool = True,
) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("user_id", user_id)
    if category:
        query = query.eq("category", category)
    if start_date:
        query = query.gte("created_at", start_date.isoformat())
    if end_date:
        query = query.lte("created_at", end_date.isoformat())
    order_col = "created_at"
    query = query.order(order_col, desc=order_desc)
    if offset:
        query = query.range(offset, offset + max(0, limit - 1))
    else:
        query = query.limit(limit)
    resp = query.execute()
    return resp.data or []


def update_expense(
    expense_id: int,
    updates: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    clean_updates: Dict[str, Any] = {}
    for key, value in updates.items():
        if key in {"amount", "credit", "category", "notes", "metadata", "created_at"}:
            if key == "created_at" and isinstance(value, date):
                clean_updates[key] = value.isoformat()
            else:
                clean_updates[key] = value

    if not clean_updates:
        return get_expense_by_id(expense_id, user_id=user_id)

    resp = _table().update(clean_updates).eq("id", expense_id).select("*").execute()
    if resp.data:
        return resp.data[0]
    return None


def delete_expense(expense_id: int) -> bool:
    resp = _table().delete().eq("expense_id", expense_id)
    # Supabase returns the deleted rows when RLS allows select on delete; otherwise check count
    if isinstance(resp.data, list):
        return len(resp.data) > 0
    # Fallback: if no data, consider success when no error was thrown
    return True


def sum_expenses(
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
) -> int:
    query = _table().select("amount", head=False).eq("user_id", user_id)
    if start_date:
        query = query.gte("created_at", start_date.isoformat())
    if end_date:
        query = query.lte("created_at", end_date.isoformat())
    if category:
        query = query.eq("category", category)
    resp = query.execute()
    rows = resp.data or []
    total = 0
    for row in rows:
        try:
            total += int(row.get("amount", 0))
        except (TypeError, ValueError):
            continue
    return total