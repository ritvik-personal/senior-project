from typing import List, Dict, Any
from app.schemas.credit_card import (
    CreditCard, 
    QuestionnaireAnswers, 
    CreditCardRecommendation,
    CreditCardRecommendationResponse,
    CardType,
    RewardsType,
    ApprovalLikelihood
)
from app.services.supabase_credit_card_service import SupabaseCreditCardService

class CreditCardService:
    def __init__(self):
        self.supabase_service = SupabaseCreditCardService()
    
    def get_recommendations(self, answers: QuestionnaireAnswers) -> CreditCardRecommendationResponse:
        """Get personalized credit card recommendations using Supabase content-based matching"""
        return self.supabase_service.get_recommendations(answers)
    
    def get_all_cards(self) -> List[CreditCard]:
        """Get all credit cards from Supabase"""
        return self.supabase_service.get_all_cards()
    
    def get_card_by_id(self, card_id: str) -> CreditCard:
        """Get a specific credit card by ID from Supabase"""
        return self.supabase_service.get_card_by_id(card_id)
    
    def record_user_interaction(self, user_id: str, card_id: str, interaction_type: str, **kwargs) -> bool:
        """Record user interaction (placeholder for future implementation)"""
        # This could be implemented later to track user interactions
        return True