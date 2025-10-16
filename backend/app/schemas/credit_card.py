from pydantic import BaseModel
from typing import List, Optional, Literal
from enum import Enum

class CardType(str, Enum):
    STUDENT = "student"
    CASHBACK = "cashback"
    TRAVEL = "travel"
    BUILDING = "building"
    PREMIUM = "premium"

class RewardsType(str, Enum):
    CASHBACK = "cashback"
    POINTS = "points"
    MILES = "miles"

class ApprovalLikelihood(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class AnnualFeePreference(str, Enum):
    NONE = "none"
    LOW = "low"
    ANY = "any"

class RewardsPreference(str, Enum):
    CASHBACK = "cashback"
    POINTS = "points"
    MILES = "miles"

class RewardsInfo(BaseModel):
    type: RewardsType
    rate: float
    categories: List[str]

class CreditCard(BaseModel):
    id: str
    name: str
    issuer: str
    type: CardType
    annual_fee: float
    apr: float
    credit_score_min: int
    credit_score_max: int
    rewards: RewardsInfo
    perks: List[str]
    approval_likelihood: ApprovalLikelihood
    student_friendly: bool
    description: str

class QuestionnaireAnswers(BaseModel):
    credit_score: int
    monthly_spending: float
    spending_categories: List[str]
    preferences: dict  # Will contain rewards, annual_fee, building_credit, student_friendly

class CreditCardRecommendation(BaseModel):
    card: CreditCard
    projected_annual_rewards: float
    match_score: float
    reasons: List[str]

class CreditCardRecommendationResponse(BaseModel):
    recommendations: List[CreditCardRecommendation]
    total_cards_analyzed: int
    filters_applied: dict
