#!/usr/bin/env python3
"""
Test script for Supabase credit card recommendations
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.supabase_credit_card_service import SupabaseCreditCardService
from app.schemas.credit_card import QuestionnaireAnswers

def test_supabase_recommendations():
    """Test the Supabase recommendation system"""
    
    try:
        service = SupabaseCreditCardService()
        print('✅ Supabase service created successfully')
        
        # Test Case 1: Student with low credit score, building credit
        print("\n=== Test Case 1: Student Building Credit ===")
        student_profile = QuestionnaireAnswers(
            credit_score=580,
            monthly_spending=400,
            spending_categories=["Dining & Restaurants", "Groceries"],
            preferences={
                "rewards": "cashback",
                "annual_fee": "none",
                "building_credit": True,
                "student_friendly": True
            }
        )
        
        recommendations = service.get_recommendations(student_profile)
        print(f"Found {len(recommendations.recommendations)} recommendations")
        for i, rec in enumerate(recommendations.recommendations[:3]):
            print(f"\n{i+1}. {rec.card.name} (Score: {rec.match_score:.2f})")
            print(f"   Projected Annual Rewards: ${rec.projected_annual_rewards:.2f}")
            print(f"   Application URL: {rec.card.application_url}")
            print(f"   Reasons: {', '.join(rec.reasons[:3])}")
        
        # Test Case 2: High credit score, travel-focused
        print("\n\n=== Test Case 2: Travel-Focused User ===")
        travel_profile = QuestionnaireAnswers(
            credit_score=750,
            monthly_spending=2000,
            spending_categories=["Travel", "Dining & Restaurants"],
            preferences={
                "rewards": "miles",
                "annual_fee": "any",
                "building_credit": False,
                "student_friendly": False
            }
        )
        
        recommendations = service.get_recommendations(travel_profile)
        print(f"Found {len(recommendations.recommendations)} recommendations")
        for i, rec in enumerate(recommendations.recommendations[:3]):
            print(f"\n{i+1}. {rec.card.name} (Score: {rec.match_score:.2f})")
            print(f"   Projected Annual Rewards: ${rec.projected_annual_rewards:.2f}")
            print(f"   Application URL: {rec.card.application_url}")
            print(f"   Reasons: {', '.join(rec.reasons[:3])}")
        
        print("\n✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure you have set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")

if __name__ == "__main__":
    test_supabase_recommendations()
