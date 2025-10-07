from supabase import Client
from app.database import get_supabase_client
from app.schemas.auth import LoginRequest, RegisterRequest, AuthResponse
import logging

logger = logging.getLogger(__name__)

class AuthService:
	def __init__(self):
		self.supabase: Client = get_supabase_client()
	
	async def login(self, login_data: LoginRequest) -> AuthResponse:
		"""Authenticate user with Supabase Auth (no custom users table)."""
		try:
			response = self.supabase.auth.sign_in_with_password({
				"email": login_data.email,
				"password": login_data.password
			})

			if response.user and response.session:
				user_metadata = getattr(response.user, "user_metadata", {}) or {}
				return AuthResponse(
					success=True,
					message="Login successful",
					user={
						"id": response.user.id,
						"email": response.user.email,
						"metadata": user_metadata,
					},
					access_token=response.session.access_token,
					refresh_token=response.session.refresh_token,
				)
			else:
				return AuthResponse(success=False, message="Invalid email or password")
		except Exception as e:
			logger.error(f"Login error: {e}")
			return AuthResponse(success=False, message="Authentication failed. Please try again.")
	
	async def register(self, register_data: RegisterRequest) -> AuthResponse:
		"""Register user with Supabase Auth (no custom users table)."""
		try:
			response = self.supabase.auth.sign_up({
				"email": register_data.email,
				"password": register_data.password,
				# no name metadata
			})

			if response.user:
				user_metadata = getattr(response.user, "user_metadata", {}) or {}
				return AuthResponse(
					success=True,
					message="Registration successful. Please verify your email.",
					user={
						"id": response.user.id,
						"email": response.user.email,
						"metadata": user_metadata,
					},
				)
			else:
				return AuthResponse(success=False, message="Registration failed")
		except Exception as e:
			logger.error(f"Registration error: {e}")
			return AuthResponse(success=False, message="Registration failed. Email may already be in use.")
	
	async def logout(self, access_token: str) -> AuthResponse:
		"""Logout user from Supabase session.
		
		Note: Supabase handles session management, so this primarily
		serves as a placeholder for any cleanup logic needed.
		The frontend should clear localStorage tokens regardless.
		"""
		try:
			# Supabase doesn't require explicit logout on server side
			# Sessions are managed client-side and expire naturally
			return AuthResponse(success=True, message="Logout successful")
		except Exception as e:
			logger.error(f"Logout error: {e}")
			return AuthResponse(success=False, message="Logout failed")
