from fastapi import APIRouter, HTTPException, Path
from typing import List
from app.schemas.credit_card import (
    CreditCard,
    QuestionnaireAnswers,
    CreditCardRecommendationResponse
)
from app.services.credit_card_service import CreditCardService

router = APIRouter()

# Initialize the credit card service
credit_card_service = CreditCardService()

@router.get("/", response_model=List[CreditCard])
async def get_all_credit_cards():
    """Get all available credit cards"""
    try:
        return credit_card_service.get_all_cards()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving credit cards: {str(e)}")

@router.get("/{card_id}", response_model=CreditCard)
async def get_credit_card(card_id: str = Path(..., description="Credit card ID")):
    """Get a specific credit card by ID"""
    try:
        return credit_card_service.get_card_by_id(card_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving credit card: {str(e)}")

@router.post("/recommendations", response_model=CreditCardRecommendationResponse)
async def get_credit_card_recommendations(answers: QuestionnaireAnswers):
    """Get personalized credit card recommendations based on questionnaire answers"""
    try:
        # Validate the questionnaire answers
        if answers.credit_score <= 0:
            raise HTTPException(status_code=400, detail="Credit score must be greater than 0")
        
        if answers.monthly_spending < 0:
            raise HTTPException(status_code=400, detail="Monthly spending cannot be negative")
        
        if answers.credit_score < 300 or answers.credit_score > 850:
            raise HTTPException(status_code=400, detail="Credit score must be between 300 and 850")
        
        return credit_card_service.get_recommendations(answers)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@router.get("/categories/spending", response_model=List[str])
async def get_spending_categories():
    """Get available spending categories for the questionnaire"""
    return [
        "Dining & Restaurants",
        "Groceries",
        "Gas & Transportation",
        "Entertainment",
        "Shopping",
        "Travel",
        "Utilities",
        "Education",
        "Healthcare"
    ]

@router.get("/categories/credit-score", response_model=List[dict])
async def get_credit_score_ranges():
    """Get available credit score ranges for the questionnaire"""
    return [
        {"range": "300-579", "value": 450, "label": "Poor"},
        {"range": "580-669", "value": 625, "label": "Fair"},
        {"range": "670-739", "value": 705, "label": "Good"},
        {"range": "740+", "value": 750, "label": "Excellent"}
    ]

@router.get("/categories/monthly-spending", response_model=List[dict])
async def get_monthly_spending_ranges():
    """Get available monthly spending ranges for the questionnaire"""
    return [
        {"range": "$0-500", "value": 250},
        {"range": "$500-1000", "value": 750},
        {"range": "$1000-2000", "value": 1500},
        {"range": "$2000+", "value": 2500}
    ]
