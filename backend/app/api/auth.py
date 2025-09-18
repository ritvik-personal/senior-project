from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.auth import LoginRequest, RegisterRequest, AuthResponse
from app.services.auth_service import AuthService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Initialize auth service
auth_service = AuthService()

@router.post("/login", response_model=AuthResponse)
async def login(login_data: LoginRequest):
    """Login user with email and password"""
    try:
        result = await auth_service.login(login_data)
        
        if not result.success:
            raise HTTPException(status_code=401, detail=result.message)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/register", response_model=AuthResponse)
async def register(register_data: RegisterRequest):
    """Register new user"""
    try:
        result = await auth_service.register(register_data)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Register endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/logout", response_model=AuthResponse)
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user"""
    try:
        result = await auth_service.logout(credentials.credentials)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user information"""
    try:
        # Verify token and get user info
        # This would typically verify the JWT token and return user data
        return {"message": "User info endpoint - implement token verification"}
    except Exception as e:
        logger.error(f"Get user endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
