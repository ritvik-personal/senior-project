from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extract and verify JWT token to get current user"""
    try:
        supabase: Client = get_supabase_client()
        
        # Verify the token with Supabase
        response = supabase.auth.get_user(credentials.credentials)
        
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Extract user information
        user_metadata = getattr(response.user, "user_metadata", {}) or {}
        user_info = {
            "id": response.user.id,
            "email": response.user.email,
            "metadata": user_metadata,
        }
        
        return user_info
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from JWT token"""
    user = await get_current_user(credentials)
    return user["id"]

async def get_access_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract access token from Authorization header"""
    return credentials.credentials
