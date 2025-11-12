import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    # Prefer ANON key, but also allow SUPABASE_KEY env var as fallback
    SUPABASE_PUBLIC_KEY: str = os.getenv("SUPABASE_PUBLIC_KEY", "")
    
    # OpenAI Configuration (for embeddings)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # NVIDIA NIM Configuration
    NIM_API_KEY: str = os.getenv("NIM_API_KEY", "")
    NIM_BASE_URL: str = os.getenv("NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NIM_MODEL: str = os.getenv("NIM_MODEL", "meta/llama-3.1-8b-instruct")  # Default NIM model
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ]
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
