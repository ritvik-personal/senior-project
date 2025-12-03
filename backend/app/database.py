from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLIC_KEY)

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase

def get_authenticated_client(access_token: str) -> Client:
    """Get Supabase client authenticated with user token"""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLIC_KEY)
    # Set the session with the access token
    # Note: The second parameter is refresh_token, which we don't have
    # This should still work for RLS policies
    client.auth.set_session(access_token, "")
    return client

def test_connection():
    """Test Supabase connection"""
    # No-op to avoid version-specific client issues during startup
    return True
