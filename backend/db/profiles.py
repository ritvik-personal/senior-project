from typing import Any, Dict, Optional
from app.database import get_authenticated_client, get_supabase_client, get_service_client

TABLE_NAME = "profiles"

def _table():
    return get_supabase_client().table(TABLE_NAME)

def _authed_table(access_token: str):
    return get_authenticated_client(access_token).table(TABLE_NAME)

def create_profile(user_id: str, first_name: str, last_name: str, access_token: Optional[str] = None) -> Dict[str, Any]:
    payload = {
        "user_id": user_id,
        "first_name": first_name,
        "last_name": last_name,
    }
    # Prefer service client (bypasses RLS for setup scenarios)
    try:
        service = get_service_client()
        resp = service.table(TABLE_NAME).upsert(payload, on_conflict="user_id").execute()
        if resp.data:
            return resp.data[0]
    except Exception:
        pass

    # Fall back to authenticated user token if available
    try:
        if access_token:
            resp = _authed_table(access_token).upsert(payload, on_conflict="user_id").execute()
            if resp.data:
                return resp.data[0]
    except Exception:
        pass

    # Last resort: unauthenticated (will only work if RLS allows)
    resp = _table().upsert(payload, on_conflict="user_id").execute()
    return resp.data[0] if resp.data else payload

def get_profile(user_id: str, access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    table = _authed_table(access_token) if access_token else _table()
    resp = table.select("*").eq("user_id", user_id).single().execute()
    return resp.data

