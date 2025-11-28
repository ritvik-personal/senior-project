from typing import Any, Dict, List, Optional
from datetime import date, datetime
import logging
import json

from app.database import get_supabase_client, get_authenticated_client

logger = logging.getLogger(__name__)

TABLE_NAME = "budgets"

def _table():
    return get_supabase_client().table(TABLE_NAME)

def _authenticated_table(access_token: str):
    return get_authenticated_client(access_token).table(TABLE_NAME)

def _map_budget_fields(budget_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map database fields to schema fields"""
    # Parse categories JSON if it's a string
    categories = budget_data.get("categories", [])
    if isinstance(categories, str):
        categories = json.loads(categories)
    
    return {
        "id": str(budget_data.get("budget_id", "")),
        "user_id": budget_data.get("user_id"),
        "name": budget_data.get("name"),
        "monthly_income": float(budget_data.get("monthly_income", 0)),
        "savings_goal": float(budget_data.get("savings_goal", 0)),
        "categories": categories,
        "template_id": budget_data.get("template_id"),
        "start_date": budget_data.get("start_date"),
        "end_date": budget_data.get("end_date"),
        "created_at": budget_data.get("created_at"),
        "updated_at": budget_data.get("updated_at"),
    }

def create_budget(
    user_id: str,
    name: str,
    monthly_income: float,
    savings_goal: float,
    categories: List[Dict[str, Any]],
    template_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    access_token: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new budget"""
    payload: Dict[str, Any] = {
        "user_id": user_id,
        "name": name,
        "monthly_income": monthly_income,
        "savings_goal": savings_goal,
        "categories": json.dumps(categories),  # Store as JSON string
    }
    
    if template_id:
        payload["template_id"] = template_id
    if start_date:
        payload["start_date"] = start_date.isoformat()
    if end_date:
        payload["end_date"] = end_date.isoformat()
    
    logger.debug("Inserting budget payload=%s", payload)
    
    try:
        if access_token:
            resp = _authenticated_table(access_token).insert(payload).execute()
        else:
            resp = _table().insert(payload).execute()
    except Exception as e:
        logger.error(f"Error inserting budget: {e}")
        logger.error(f"Payload that failed: {payload}")
        error_msg = str(e)
        if hasattr(e, 'message'):
            error_msg = e.message
        elif hasattr(e, 'args') and len(e.args) > 0:
            error_msg = str(e.args[0])
        raise RuntimeError(f"Failed to insert budget: {error_msg}")
    
    if resp.data:
        budget_data = resp.data[0]
        logger.debug("Database returned: %s", budget_data)
        return _map_budget_fields(budget_data)
    else:
        raise RuntimeError("Failed to create budget: No data returned")

def get_budget_by_id(
    budget_id: str,
    access_token: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Get a budget by ID"""
    try:
        if access_token:
            resp = _authenticated_table(access_token).select("*").eq("budget_id", budget_id).execute()
        else:
            resp = _table().select("*").eq("budget_id", budget_id).execute()
    except Exception as e:
        logger.error(f"Error fetching budget: {e}")
        raise RuntimeError(f"Failed to fetch budget: {str(e)}")
    
    if resp.data and len(resp.data) > 0:
        return _map_budget_fields(resp.data[0])
    return None

def list_budgets(
    user_id: str,
    limit: int = 100,
    offset: int = 0,
    order_desc: bool = True,
    access_token: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List budgets for a user"""
    try:
        query = _authenticated_table(access_token) if access_token else _table()
        query = query.select("*").eq("user_id", user_id)
        
        # Order by created_at
        if order_desc:
            query = query.order("created_at", desc=True)
        else:
            query = query.order("created_at", desc=False)
        
        # Apply limit and offset
        query = query.range(offset, offset + limit - 1)
        
        resp = query.execute()
    except Exception as e:
        logger.error(f"Error listing budgets: {e}")
        raise RuntimeError(f"Failed to list budgets: {str(e)}")
    
    if resp.data:
        return [_map_budget_fields(budget) for budget in resp.data]
    return []

def update_budget(
    budget_id: str,
    updates: Dict[str, Any],
    access_token: Optional[str] = None,
    current_user_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Update a budget"""
    # Verify ownership if current_user_id is provided
    if current_user_id:
        existing = get_budget_by_id(budget_id, access_token)
        if not existing or existing.get("user_id") != current_user_id:
            logger.warning(f"User {current_user_id} attempted to update budget {budget_id} they don't own")
            return None
    
    # Prepare update payload
    update_payload: Dict[str, Any] = {}
    
    # Map schema fields to database fields
    field_mapping = {
        "name": "name",
        "monthly_income": "monthly_income",
        "savings_goal": "savings_goal",
        "categories": "categories",  # Will be serialized
        "template_id": "template_id",
        "start_date": "start_date",
        "end_date": "end_date",
    }
    
    for key, value in updates.items():
        if key in field_mapping:
            db_key = field_mapping[key]
            if key == "categories" and isinstance(value, list):
                # Serialize categories to JSON
                update_payload[db_key] = json.dumps(value)
            elif key in ["start_date", "end_date"] and value:
                # Convert date to ISO string
                if isinstance(value, date):
                    update_payload[db_key] = value.isoformat()
                elif isinstance(value, str):
                    update_payload[db_key] = value
            else:
                update_payload[db_key] = value
    
    if not update_payload:
        logger.warning("No valid fields to update")
        return None
    
    # Add updated_at timestamp
    update_payload["updated_at"] = datetime.utcnow().isoformat()
    
    try:
        if access_token:
            resp = _authenticated_table(access_token).update(update_payload).eq("budget_id", budget_id).execute()
        else:
            resp = _table().update(update_payload).eq("budget_id", budget_id).execute()
    except Exception as e:
        logger.error(f"Error updating budget: {e}")
        logger.error(f"Update payload that failed: {update_payload}")
        error_msg = str(e)
        if hasattr(e, 'message'):
            error_msg = e.message
        elif hasattr(e, 'args') and len(e.args) > 0:
            error_msg = str(e.args[0])
        raise RuntimeError(f"Failed to update budget: {error_msg}")
    
    if resp.data and len(resp.data) > 0:
        return _map_budget_fields(resp.data[0])
    return None

def delete_budget(
    budget_id: str,
    access_token: Optional[str] = None,
    current_user_id: Optional[str] = None,
) -> bool:
    """Delete a budget"""
    # Verify ownership if current_user_id is provided
    if current_user_id:
        existing = get_budget_by_id(budget_id, access_token)
        if not existing or existing.get("user_id") != current_user_id:
            logger.warning(f"User {current_user_id} attempted to delete budget {budget_id} they don't own")
            return False
    
    try:
        if access_token:
            resp = _authenticated_table(access_token).delete().eq("budget_id", budget_id).execute()
        else:
            resp = _table().delete().eq("budget_id", budget_id).execute()
    except Exception as e:
        logger.error(f"Error deleting budget: {e}")
        raise RuntimeError(f"Failed to delete budget: {str(e)}")
    
    # Check if deletion was successful (Supabase returns data with deleted rows)
    return True

