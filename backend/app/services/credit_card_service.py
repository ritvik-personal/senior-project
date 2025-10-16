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

class CreditCardService:
    def __init__(self):
        self.credit_cards = self._load_credit_cards()
    
    def _load_credit_cards(self) -> List[CreditCard]:
        """Load the credit card database"""
        return [
            CreditCard(
                id="1",
                name="Discover it Student Cash Back",
                issuer="Discover",
                type=CardType.STUDENT,
                annual_fee=0,
                apr=18.99,
                credit_score_min=300,
                credit_score_max=850,
                rewards={
                    "type": RewardsType.CASHBACK,
                    "rate": 5.0,
                    "categories": ["Rotating categories", "All other purchases"]
                },
                perks=[
                    "Good Grades Reward",
                    "No annual fee",
                    "Cashback match first year",
                    "No late fee on first late payment"
                ],
                approval_likelihood=ApprovalLikelihood.HIGH,
                student_friendly=True,
                description="Perfect for students building credit with rotating 5% cashback categories."
            ),
            CreditCard(
                id="2",
                name="Capital One SavorOne Student",
                issuer="Capital One",
                type=CardType.STUDENT,
                annual_fee=0,
                apr=19.99,
                credit_score_min=300,
                credit_score_max=850,
                rewards={
                    "type": RewardsType.CASHBACK,
                    "rate": 3.0,
                    "categories": ["Dining", "Entertainment", "Streaming"]
                },
                perks=[
                    "No foreign transaction fees",
                    "No annual fee",
                    "Student-friendly",
                    "Access to Capital One Entertainment"
                ],
                approval_likelihood=ApprovalLikelihood.HIGH,
                student_friendly=True,
                description="Great for students who spend on dining and entertainment."
            ),
            CreditCard(
                id="3",
                name="Chase Freedom Student",
                issuer="Chase",
                type=CardType.STUDENT,
                annual_fee=0,
                apr=20.99,
                credit_score_min=300,
                credit_score_max=850,
                rewards={
                    "type": RewardsType.CASHBACK,
                    "rate": 1.0,
                    "categories": ["All purchases"]
                },
                perks=[
                    "No annual fee",
                    "Credit monitoring",
                    "Student rewards",
                    "Access to Chase Ultimate Rewards"
                ],
                approval_likelihood=ApprovalLikelihood.MEDIUM,
                student_friendly=True,
                description="Simple cashback card for students starting their credit journey."
            ),
            CreditCard(
                id="4",
                name="Citi Double Cash",
                issuer="Citi",
                type=CardType.CASHBACK,
                annual_fee=0,
                apr=19.99,
                credit_score_min=670,
                credit_score_max=850,
                rewards={
                    "type": RewardsType.CASHBACK,
                    "rate": 2.0,
                    "categories": ["All purchases"]
                },
                perks=[
                    "No annual fee",
                    "2% on everything",
                    "No categories to track",
                    "Citi Entertainment access"
                ],
                approval_likelihood=ApprovalLikelihood.MEDIUM,
                student_friendly=False,
                description="Excellent flat-rate cashback card for consistent spending."
            ),
            CreditCard(
                id="5",
                name="Chase Sapphire Preferred",
                issuer="Chase",
                type=CardType.TRAVEL,
                annual_fee=95,
                apr=21.99,
                credit_score_min=690,
                credit_score_max=850,
                rewards={
                    "type": RewardsType.POINTS,
                    "rate": 2.0,
                    "categories": ["Travel", "Dining"]
                },
                perks=[
                    "60k bonus points",
                    "Travel protection",
                    "Transfer partners",
                    "Primary rental car coverage"
                ],
                approval_likelihood=ApprovalLikelihood.LOW,
                student_friendly=False,
                description="Premium travel rewards card with excellent benefits."
            ),
            CreditCard(
                id="6",
                name="Bank of America Travel Rewards for Students",
                issuer="Bank of America",
                type=CardType.TRAVEL,
                annual_fee=0,
                apr=18.99,
                credit_score_min=300,
                credit_score_max=850,
                rewards={
                    "type": RewardsType.POINTS,
                    "rate": 1.5,
                    "categories": ["All purchases"]
                },
                perks=[
                    "No annual fee",
                    "No foreign transaction fees",
                    "Student-friendly",
                    "Flexible redemption"
                ],
                approval_likelihood=ApprovalLikelihood.HIGH,
                student_friendly=True,
                description="Great travel rewards card for students with no annual fee."
            ),
            CreditCard(
                id="7",
                name="Wells Fargo Active Cash",
                issuer="Wells Fargo",
                type=CardType.CASHBACK,
                annual_fee=0,
                apr=20.99,
                credit_score_min=650,
                credit_score_max=850,
                rewards={
                    "type": RewardsType.CASHBACK,
                    "rate": 2.0,
                    "categories": ["All purchases"]
                },
                perks=[
                    "No annual fee",
                    "2% on everything",
                    "Cell phone protection",
                    "Wells Fargo Go Far Rewards"
                ],
                approval_likelihood=ApprovalLikelihood.MEDIUM,
                student_friendly=False,
                description="Simple 2% cashback on all purchases with no annual fee."
            ),
            CreditCard(
                id="8",
                name="Capital One Platinum Secured",
                issuer="Capital One",
                type=CardType.BUILDING,
                annual_fee=0,
                apr=26.99,
                credit_score_min=300,
                credit_score_max=600,
                rewards={
                    "type": RewardsType.CASHBACK,
                    "rate": 0.0,
                    "categories": []
                },
                perks=[
                    "No annual fee",
                    "Credit building",
                    "Flexible security deposit",
                    "Access to higher credit line"
                ],
                approval_likelihood=ApprovalLikelihood.HIGH,
                student_friendly=True,
                description="Secured card perfect for building credit from scratch."
            )
        ]
    
    def get_recommendations(self, answers: QuestionnaireAnswers) -> CreditCardRecommendationResponse:
        """Get personalized credit card recommendations based on questionnaire answers"""
        filtered_cards = self._filter_cards(answers)
        recommendations = []
        
        for card in filtered_cards:
            projected_rewards = self._calculate_projected_rewards(card, answers)
            match_score = self._calculate_match_score(card, answers)
            reasons = self._generate_match_reasons(card, answers)
            
            recommendations.append(CreditCardRecommendation(
                card=card,
                projected_annual_rewards=projected_rewards,
                match_score=match_score,
                reasons=reasons
            ))
        
        # Sort by match score (highest first)
        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        
        return CreditCardRecommendationResponse(
            recommendations=recommendations,
            total_cards_analyzed=len(self.credit_cards),
            filters_applied=self._get_applied_filters(answers)
        )
    
    def _filter_cards(self, answers: QuestionnaireAnswers) -> List[CreditCard]:
        """Filter cards based on basic criteria"""
        filtered = []
        
        for card in self.credit_cards:
            # Credit score filter
            if not (card.credit_score_min <= answers.credit_score <= card.credit_score_max):
                continue
            
            # Student preference filter
            if answers.preferences.get('student_friendly', False) and not card.student_friendly:
                continue
            
            # Annual fee preference filter
            annual_fee_pref = answers.preferences.get('annual_fee', 'none')
            if annual_fee_pref == 'none' and card.annual_fee > 0:
                continue
            elif annual_fee_pref == 'low' and card.annual_fee > 50:
                continue
            
            filtered.append(card)
        
        return filtered
    
    def _calculate_projected_rewards(self, card: CreditCard, answers: QuestionnaireAnswers) -> float:
        """Calculate projected annual rewards based on spending"""
        annual_spending = answers.monthly_spending * 12
        
        if card.rewards.type == RewardsType.CASHBACK:
            return (annual_spending * card.rewards.rate) / 100
        elif card.rewards.type in [RewardsType.POINTS, RewardsType.MILES]:
            # Convert points/miles to approximate cash value (1 point/mile ≈ $0.01)
            return (annual_spending * card.rewards.rate) / 100 * 0.01
        
        return 0.0
    
    def _calculate_match_score(self, card: CreditCard, answers: QuestionnaireAnswers) -> float:
        """Calculate how well a card matches the user's preferences"""
        score = 0.0
        
        # Base score from approval likelihood
        likelihood_scores = {
            ApprovalLikelihood.HIGH: 3.0,
            ApprovalLikelihood.MEDIUM: 2.0,
            ApprovalLikelihood.LOW: 1.0
        }
        score += likelihood_scores.get(card.approval_likelihood, 1.0)
        
        # Student-friendly bonus
        if answers.preferences.get('student_friendly', False) and card.student_friendly:
            score += 2.0
        
        # Rewards type match
        if answers.preferences.get('rewards') == card.rewards.type.value:
            score += 1.5
        
        # Building credit preference
        if answers.preferences.get('building_credit', False) and card.type == CardType.BUILDING:
            score += 2.0
        
        # Spending category alignment
        spending_categories = set(answers.spending_categories)
        card_categories = set(card.rewards.categories)
        if spending_categories and card_categories:
            overlap = len(spending_categories.intersection(card_categories))
            score += overlap * 0.5
        
        # Annual fee preference
        annual_fee_pref = answers.preferences.get('annual_fee', 'none')
        if annual_fee_pref == 'none' and card.annual_fee == 0:
            score += 1.0
        elif annual_fee_pref == 'low' and 0 < card.annual_fee <= 50:
            score += 0.5
        
        return score
    
    def _generate_match_reasons(self, card: CreditCard, answers: QuestionnaireAnswers) -> List[str]:
        """Generate reasons why this card is a good match"""
        reasons = []
        
        if card.student_friendly and answers.preferences.get('student_friendly', False):
            reasons.append("Student-friendly features")
        
        if card.approval_likelihood == ApprovalLikelihood.HIGH:
            reasons.append("High approval likelihood")
        
        if answers.preferences.get('rewards') == card.rewards.type.value:
            reasons.append(f"Matches your {card.rewards.type.value} preference")
        
        if card.annual_fee == 0 and answers.preferences.get('annual_fee') == 'none':
            reasons.append("No annual fee")
        
        if answers.preferences.get('building_credit', False) and card.type == CardType.BUILDING:
            reasons.append("Great for building credit")
        
        # Check spending category alignment
        spending_categories = set(answers.spending_categories)
        card_categories = set(card.rewards.categories)
        if spending_categories and card_categories:
            overlap = spending_categories.intersection(card_categories)
            if overlap:
                reasons.append(f"Bonus rewards on your spending: {', '.join(overlap)}")
        
        return reasons
    
    def _get_applied_filters(self, answers: QuestionnaireAnswers) -> Dict[str, Any]:
        """Get information about filters that were applied"""
        return {
            "credit_score_range": f"{answers.credit_score}",
            "student_friendly": answers.preferences.get('student_friendly', False),
            "annual_fee_preference": answers.preferences.get('annual_fee', 'none'),
            "rewards_preference": answers.preferences.get('rewards', 'cashback'),
            "building_credit": answers.preferences.get('building_credit', False),
            "spending_categories": answers.spending_categories
        }
    
    def get_card_by_id(self, card_id: str) -> CreditCard:
        """Get a specific credit card by ID"""
        for card in self.credit_cards:
            if card.id == card_id:
                return card
        raise ValueError(f"Credit card with ID {card_id} not found")
    
    def get_all_cards(self) -> List[CreditCard]:
        """Get all credit cards"""
        return self.credit_cards
