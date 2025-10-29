"""
Supabase Credit Card Service with Content-Based Matching
Connects to Supabase database and provides content-based recommendations
"""

from typing import List, Dict, Any, Optional
import os
from supabase import create_client, Client
from app.schemas.credit_card import (
    QuestionnaireAnswers, 
    CreditCardRecommendation,
    CreditCardRecommendationResponse,
    CreditCard as SchemaCreditCard
)

class SupabaseCreditCardService:
    """
    Supabase Credit Card Service with Content-Based Matching
    """
    
    def __init__(self):
        self.supabase: Client = None
        self._initialized = False
    
    def _ensure_initialized(self):
        """Initialize Supabase client only when needed"""
        if not self._initialized:
            # Load environment variables
            from dotenv import load_dotenv
            # Load from backend directory
            load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
            
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_PUBLIC_KEY")
            
            if not url or not key:
                raise ValueError("SUPABASE_URL and SUPABASE_PUBLIC_KEY environment variables are required")
            
            self.supabase = create_client(url, key)
            self._initialized = True
    
    def get_recommendations(self, answers: QuestionnaireAnswers) -> CreditCardRecommendationResponse:
        """Get content-based credit card recommendations"""
        try:
            self._ensure_initialized()
            # Get all credit cards from Supabase
            response = self.supabase.table('credit_cards').select('*').execute()
            cards_data = response.data
            
            recommendations = []
            
            for card_data in cards_data:
                # Convert to schema format
                card = SchemaCreditCard(**card_data)
                
                # Skip cards that don't meet basic criteria
                if not self._meets_basic_criteria(card, answers):
                    continue
                
                # Calculate content-based match score
                match_score = self._calculate_content_score(card, answers)
                
                # Generate explanation
                explanation = self._generate_explanation(card, answers)
                
                # Calculate projected rewards
                projected_rewards = self._calculate_projected_rewards(card, answers)
                
                recommendations.append(CreditCardRecommendation(
                    card=card,
                    projected_annual_rewards=projected_rewards,
                    match_score=match_score,
                    reasons=explanation
                ))
            
            # Sort by match score (highest first)
            recommendations.sort(key=lambda x: x.match_score, reverse=True)
            
            return CreditCardRecommendationResponse(
                recommendations=recommendations,
                total_cards_analyzed=len(cards_data),
                filters_applied=self._get_applied_filters(answers)
            )
            
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return CreditCardRecommendationResponse(
                recommendations=[],
                total_cards_analyzed=0,
                filters_applied={}
            )
    
    def _meets_basic_criteria(self, card: SchemaCreditCard, answers: QuestionnaireAnswers) -> bool:
        """Check if card meets basic eligibility criteria"""
        # Credit score check
        if not (card.credit_score_min <= answers.credit_score <= card.credit_score_max):
            return False
        
        # Student preference check
        if answers.preferences.get('student_friendly', False) and not card.student_friendly:
            return False
        
        # Annual fee preference check
        annual_fee_pref = answers.preferences.get('annual_fee', 'none')
        if annual_fee_pref == 'none' and card.annual_fee > 0:
            return False
        elif annual_fee_pref == 'low' and card.annual_fee > 50:
            return False
        
        return True
    
    def _calculate_content_score(self, card: SchemaCreditCard, answers: QuestionnaireAnswers) -> float:
        """Calculate content-based matching score"""
        score = 0.0
        
        # Rewards type match (3 points)
        if answers.preferences.get('rewards') == card.rewards_type:
            score += 3.0
        
        # Student-friendly bonus (2 points)
        if answers.preferences.get('student_friendly', False) and card.student_friendly:
            score += 2.0
        
        # Building credit preference (2 points)
        if answers.preferences.get('building_credit', False) and card.type == 'building':
            score += 2.0
        
        # Spending category alignment (0.5 points per match)
        spending_categories = set(answers.spending_categories)
        card_categories = set(card.rewards_categories)
        if spending_categories and card_categories:
            overlap = len(spending_categories.intersection(card_categories))
            score += overlap * 0.5
        
        # Annual fee preference (1 point)
        annual_fee_pref = answers.preferences.get('annual_fee', 'none')
        if annual_fee_pref == 'none' and card.annual_fee == 0:
            score += 1.0
        elif annual_fee_pref == 'low' and 0 < card.annual_fee <= 50:
            score += 0.5
        
        # Approval likelihood bonus (1-3 points)
        if card.approval_likelihood == 'high':
            score += 3.0
        elif card.approval_likelihood == 'medium':
            score += 2.0
        else:
            score += 1.0
        
        # Rewards rate bonus (0.5 points per 1% rate)
        score += card.rewards_rate * 0.5
        
        # Credit score compatibility bonus (0-2 points)
        credit_score_range = card.credit_score_max - card.credit_score_min
        credit_score_center = (card.credit_score_max + card.credit_score_min) / 2
        credit_compatibility = 1.0 - abs(answers.credit_score - credit_score_center) / credit_score_range
        credit_compatibility = max(0, credit_compatibility)
        score += credit_compatibility * 2.0
        
        return min(score, 10.0)  # Cap at 10
    
    def _generate_explanation(self, card: SchemaCreditCard, answers: QuestionnaireAnswers) -> List[str]:
        """Generate explanation for why this card was recommended"""
        explanations = []
        
        # Content-based explanations
        if answers.preferences.get('rewards') == card.rewards_type:
            explanations.append(f"Matches your {card.rewards_type} preference")
        
        if answers.preferences.get('student_friendly', False) and card.student_friendly:
            explanations.append("Student-friendly features")
        
        if answers.preferences.get('building_credit', False) and card.type == 'building':
            explanations.append("Great for building credit")
        
        if card.annual_fee == 0 and answers.preferences.get('annual_fee') == 'none':
            explanations.append("No annual fee")
        
        if card.rewards_rate > 2:
            explanations.append(f"High rewards rate ({card.rewards_rate}%)")
        
        if card.approval_likelihood == 'high':
            explanations.append("High approval likelihood")
        
        # Spending category alignment
        spending_categories = set(answers.spending_categories)
        card_categories = set(card.rewards_categories)
        if spending_categories and card_categories:
            overlap = spending_categories.intersection(card_categories)
            if overlap:
                explanations.append(f"Bonus rewards on: {', '.join(overlap)}")
        
        return explanations[:5]  # Limit to top 5 explanations
    
    def _calculate_projected_rewards(self, card: SchemaCreditCard, answers: QuestionnaireAnswers) -> float:
        """Calculate projected annual rewards"""
        annual_spending = answers.monthly_spending * 12
        
        if card.rewards_type == 'cashback':
            return (annual_spending * card.rewards_rate) / 100
        elif card.rewards_type in ['points', 'miles']:
            # Convert points/miles to approximate cash value (1 point/mile ≈ $0.01)
            return (annual_spending * card.rewards_rate) / 100 * 0.01
        
        return 0.0
    
    def _get_applied_filters(self, answers: QuestionnaireAnswers) -> Dict[str, Any]:
        """Get information about filters that were applied"""
        return {
            "credit_score_range": f"{answers.credit_score}",
            "student_friendly": answers.preferences.get('student_friendly', False),
            "annual_fee_preference": answers.preferences.get('annual_fee', 'none'),
            "rewards_preference": answers.preferences.get('rewards', 'cashback'),
            "building_credit": answers.preferences.get('building_credit', False),
            "spending_categories": answers.spending_categories,
            "algorithm": "content_based_matching"
        }
    
    def get_all_cards(self) -> List[SchemaCreditCard]:
        """Get all credit cards from Supabase"""
        try:
            self._ensure_initialized()
            response = self.supabase.table('credit_cards').select('*').execute()
            cards = []
            
            for card_data in response.data:
                cards.append(SchemaCreditCard(**card_data))
            
            return cards
        except Exception as e:
            print(f"Error fetching credit cards: {e}")
            return []
    
    def get_card_by_id(self, card_id: str) -> Optional[SchemaCreditCard]:
        """Get a specific credit card by ID"""
        try:
            self._ensure_initialized()
            response = self.supabase.table('credit_cards').select('*').eq('id', card_id).execute()
            
            if response.data:
                return SchemaCreditCard(**response.data[0])
            return None
        except Exception as e:
            print(f"Error fetching credit card {card_id}: {e}")
            return None
