from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLIC_KEY)

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase

def test_connection():
    """Test Supabase connection"""
    try:
        # Simple query to test connection
        result = supabase.table("users").select("id").limit(1).execute()
        logger.info("Supabase connection successful")
        return True
    except Exception as e:
        logger.error(f"Supabase connection failed: {e}")
        return False
