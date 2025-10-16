/**
 * Credit Card 'Fit' Tool Page Component
 * 
 * This component provides personalized credit card recommendations for students.
 * Features:
 * - Short questionnaire to assess spending habits and preferences
 * - Credit score range input
 * - Spending category preferences
 * - Filtered card recommendations based on student needs
 * - Projected annual rewards calculation
 * - Key perks and benefits highlighting
 * - Simple approval likelihood (low/medium/high)
 * - Beginner-friendly card database
 * 
 * Card categories:
 * - Student cards
 * - Cashback cards
 * - Travel rewards
 * - No annual fee cards
 * - Building credit cards
 */

"use client";

import { useState } from "react";
import api from "@/utils/api";

// Credit Card Tool Interfaces
interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  type: 'student' | 'cashback' | 'travel' | 'building' | 'premium';
  annual_fee: number;
  apr: number;
  credit_score_min: number;
  credit_score_max: number;
  rewards: {
    type: 'cashback' | 'points' | 'miles';
    rate: number;
    categories: string[];
  };
  perks: string[];
  approval_likelihood: 'low' | 'medium' | 'high';
  student_friendly: boolean;
  description: string;
}

interface CreditCardRecommendation {
  card: CreditCard;
  projected_annual_rewards: number;
  match_score: number;
  reasons: string[];
}

interface CreditCardRecommendationResponse {
  recommendations: CreditCardRecommendation[];
  total_cards_analyzed: number;
  filters_applied: any;
}

interface QuestionnaireAnswers {
  creditScore: number;
  monthlySpending: number;
  spendingCategories: string[];
  preferences: {
    rewards: 'cashback' | 'points' | 'miles';
    annualFee: 'none' | 'low' | 'any';
    buildingCredit: boolean;
    studentFriendly: boolean;
  };
}

export default function CreditCardToolPage() {
  // Credit Card Tool State
  const [creditCardStep, setCreditCardStep] = useState<'questionnaire' | 'results' | 'details'>('questionnaire');
  const [creditCardAnswers, setCreditCardAnswers] = useState<QuestionnaireAnswers>({
    creditScore: 0,
    monthlySpending: 0,
    spendingCategories: [],
    preferences: {
      rewards: 'cashback',
      annualFee: 'none',
      buildingCredit: false,
      studentFriendly: true
    }
  });
  const [creditCardRecommendations, setCreditCardRecommendations] = useState<CreditCardRecommendation[]>([]);
  const [selectedCreditCard, setSelectedCreditCard] = useState<CreditCard | null>(null);
  const [creditCardLoading, setCreditCardLoading] = useState(false);
  const [creditCardError, setCreditCardError] = useState<string | null>(null);

  // Credit Card Tool Functions
  const handleCreditCardAnswerChange = (field: keyof QuestionnaireAnswers, value: any) => {
    setCreditCardAnswers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreditCardPreferenceChange = (field: keyof QuestionnaireAnswers['preferences'], value: any) => {
    setCreditCardAnswers(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const handleCreditCardCategoryToggle = (category: string) => {
    setCreditCardAnswers(prev => ({
      ...prev,
      spendingCategories: prev.spendingCategories.includes(category)
        ? prev.spendingCategories.filter(c => c !== category)
        : [...prev.spendingCategories, category]
    }));
  };

  const calculateCreditCardRecommendations = async () => {
    setCreditCardLoading(true);
    setCreditCardError(null);
    
    try {
      // Transform frontend answers to backend format
      const backendAnswers = {
        credit_score: creditCardAnswers.creditScore,
        monthly_spending: creditCardAnswers.monthlySpending,
        spending_categories: creditCardAnswers.spendingCategories,
        preferences: creditCardAnswers.preferences
      };

      const response = await api.post('/credit-cards/recommendations', backendAnswers);
      const data: CreditCardRecommendationResponse = await response.json();
      
      setCreditCardRecommendations(data.recommendations);
      setCreditCardStep('results');
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setCreditCardError('Failed to get credit card recommendations. Please try again.');
    } finally {
      setCreditCardLoading(false);
    }
  };

  const calculateProjectedRewards = (recommendation: CreditCardRecommendation) => {
    return recommendation.projected_annual_rewards;
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLikelihoodIcon = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💳</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Credit Card 'Fit' Tool</h2>
                  <p className="text-blue-100 text-lg">Find the perfect credit card for your student lifestyle</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Personalized Recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Student-Friendly Cards</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Rewards Calculator</span>
                </div>
              </div>
            </div>
            {creditCardStep !== 'questionnaire' && (
              <button
                onClick={() => setCreditCardStep('questionnaire')}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/20 hover:border-white/40"
              >
                <span className="flex items-center space-x-2">
                  <span>🔄</span>
                  <span>Retake Quiz</span>
                </span>
              </button>
            )}
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* Enhanced Questionnaire */}
      {creditCardStep === 'questionnaire' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Credit Card Questionnaire</h3>
                <p className="text-gray-600 dark:text-gray-300">Answer a few questions to get personalized recommendations</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-10">
            {/* Enhanced Credit Score */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📊</span>
                </div>
                <label className="text-lg font-semibold text-gray-900 dark:text-white">
                  What's your credit score range?
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { range: '300-579', value: 450, label: 'Poor', color: 'red', icon: '🔴' },
                  { range: '580-669', value: 625, label: 'Fair', color: 'orange', icon: '🟠' },
                  { range: '670-739', value: 705, label: 'Good', color: 'yellow', icon: '🟡' },
                  { range: '740+', value: 750, label: 'Excellent', color: 'green', icon: '🟢' }
                ].map(score => (
                  <button
                    key={score.value}
                    onClick={() => handleCreditCardAnswerChange('creditScore', score.value)}
                    className={`group relative p-4 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                      creditCardAnswers.creditScore === score.value
                        ? `border-${score.color}-500 bg-${score.color}-50 dark:bg-${score.color}-900/20 shadow-lg`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">{score.icon}</div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">{score.range}</div>
                    <div className={`text-sm font-medium ${
                      creditCardAnswers.creditScore === score.value 
                        ? `text-${score.color}-700 dark:text-${score.color}-300`
                        : 'text-gray-600 dark:text-gray-300'
                    }`}>{score.label}</div>
                    {creditCardAnswers.creditScore === score.value && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Monthly Spending */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-sm">💰</span>
                </div>
                <label className="text-lg font-semibold text-gray-900 dark:text-white">
                  How much do you typically spend per month on your credit card?
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { range: '$0-500', value: 250, icon: '💳', desc: 'Light spender' },
                  { range: '$500-1000', value: 750, icon: '💸', desc: 'Moderate spender' },
                  { range: '$1000-2000', value: 1500, icon: '💵', desc: 'Heavy spender' },
                  { range: '$2000+', value: 2500, icon: '💎', desc: 'High spender' }
                ].map(spending => (
                  <button
                    key={spending.value}
                    onClick={() => handleCreditCardAnswerChange('monthlySpending', spending.value)}
                    className={`group relative p-4 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                      creditCardAnswers.monthlySpending === spending.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">{spending.icon}</div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">{spending.range}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{spending.desc}</div>
                    {creditCardAnswers.monthlySpending === spending.value && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Spending Categories */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🛍️</span>
                </div>
                <label className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select your top spending categories (choose all that apply):
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'Dining & Restaurants', icon: '🍽️' },
                  { name: 'Groceries', icon: '🛒' },
                  { name: 'Gas & Transportation', icon: '⛽' },
                  { name: 'Entertainment', icon: '🎬' },
                  { name: 'Shopping', icon: '🛍️' },
                  { name: 'Travel', icon: '✈️' },
                  { name: 'Utilities', icon: '🏠' },
                  { name: 'Education', icon: '📚' },
                  { name: 'Healthcare', icon: '🏥' }
                ].map(category => (
                  <button
                    key={category.name}
                    onClick={() => handleCreditCardCategoryToggle(category.name)}
                    className={`group relative p-3 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                      creditCardAnswers.spendingCategories.includes(category.name)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="text-xl mb-1">{category.icon}</div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{category.name}</div>
                    {creditCardAnswers.spendingCategories.includes(category.name) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Preferences */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-sm">⚙️</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    What type of rewards do you prefer?
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'cashback', label: 'Cash Back', icon: '💰', desc: 'Direct cash rewards' },
                      { value: 'points', label: 'Points', icon: '⭐', desc: 'Flexible points system' },
                      { value: 'miles', label: 'Miles', icon: '✈️', desc: 'Travel rewards' }
                    ].map(reward => (
                      <button
                        key={reward.value}
                        onClick={() => handleCreditCardPreferenceChange('rewards', reward.value)}
                        className={`group relative p-4 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                          creditCardAnswers.preferences.rewards === reward.value
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <div className="text-3xl mb-2">{reward.icon}</div>
                        <div className="font-bold text-gray-900 dark:text-white">{reward.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{reward.desc}</div>
                        {creditCardAnswers.preferences.rewards === reward.value && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Annual fee preference:
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'none', label: 'No Annual Fee', icon: '🆓', desc: 'Free forever' },
                      { value: 'low', label: 'Low Fee ($0-50)', icon: '💵', desc: 'Minimal cost' },
                      { value: 'any', label: 'Any Fee', icon: '💎', desc: 'Premium benefits' }
                    ].map(fee => (
                      <button
                        key={fee.value}
                        onClick={() => handleCreditCardPreferenceChange('annualFee', fee.value)}
                        className={`group relative p-4 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                          creditCardAnswers.preferences.annualFee === fee.value
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <div className="text-3xl mb-2">{fee.icon}</div>
                        <div className="font-bold text-gray-900 dark:text-white">{fee.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{fee.desc}</div>
                        {creditCardAnswers.preferences.annualFee === fee.value && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={creditCardAnswers.preferences.buildingCredit}
                          onChange={(e) => handleCreditCardPreferenceChange('buildingCredit', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          creditCardAnswers.preferences.buildingCredit
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                        }`}>
                          {creditCardAnswers.preferences.buildingCredit && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Building Credit</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">I'm focused on building credit</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={creditCardAnswers.preferences.studentFriendly}
                          onChange={(e) => handleCreditCardPreferenceChange('studentFriendly', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          creditCardAnswers.preferences.studentFriendly
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                        }`}>
                          {creditCardAnswers.preferences.studentFriendly && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Student-Friendly</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Student features important</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={calculateCreditCardRecommendations}
                disabled={creditCardAnswers.creditScore === 0 || creditCardAnswers.monthlySpending === 0 || creditCardLoading}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
              >
                <div className="flex items-center space-x-3">
                  {creditCardLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Finding Your Perfect Card...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🔍</span>
                      <span>Find My Perfect Card</span>
                    </>
                  )}
                </div>
                {!creditCardLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300 -z-10"></div>
                )}
              </button>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                We'll analyze your preferences and recommend the best credit cards for your student lifestyle
              </p>
            </div>

            {/* Enhanced Error Message */}
            {creditCardError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl flex items-center space-x-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{creditCardError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Results */}
      {creditCardStep === 'results' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Credit Card Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Based on your preferences, here are the best credit cards for you:
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                {creditCardRecommendations.map((recommendation, index) => {
                  const card = recommendation.card;
                  return (
                    <div key={card.id} className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                      {/* Rank Badge */}
                      <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        #{index + 1}
                      </div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{card.name}</h4>
                            {card.student_friendly && (
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                                🎓 Student-Friendly
                              </span>
                            )}
                          </div>
                          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">{card.issuer}</p>
                          <p className="text-gray-500 dark:text-gray-400 mt-2">{card.description}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getLikelihoodColor(card.approval_likelihood)}`}>
                            {getLikelihoodIcon(card.approval_likelihood)} {card.approval_likelihood.toUpperCase()} APPROVAL
                          </div>
                          <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 text-green-800 dark:text-green-300 px-3 py-2 rounded-xl text-sm font-semibold">
                            Match Score: {recommendation.match_score.toFixed(1)}/10
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">🆓</span>
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Annual Fee</div>
                          </div>
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {card.annual_fee === 0 ? 'FREE' : `$${card.annual_fee}`}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">⭐</span>
                            <div className="text-sm font-medium text-green-700 dark:text-green-300">Rewards Rate</div>
                          </div>
                          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {card.rewards.rate}% {card.rewards.type}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">💰</span>
                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Projected Annual Rewards</div>
                          </div>
                          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            ${calculateProjectedRewards(recommendation).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">🎯</span>
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Why This Card Matches:</h5>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {recommendation.reasons.map((reason, idx) => (
                              <span key={idx} className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-xl text-sm font-medium border border-green-200 dark:border-green-800">
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">✨</span>
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Key Perks:</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {card.perks.map((perk, idx) => (
                              <div key={idx} className="flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                                <span className="text-blue-500">✨</span>
                                <span className="text-blue-800 dark:text-blue-300 font-medium">{perk}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">📊</span>
                            <span className="text-gray-600 dark:text-gray-300">APR: <span className="font-semibold">{card.apr}%</span></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">🎯</span>
                            <span className="text-gray-600 dark:text-gray-300">Credit Score: <span className="font-semibold">{card.credit_score_min}-{card.credit_score_max}</span></span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCreditCard(card);
                            setCreditCardStep('details');
                          }}
                          className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                        >
                          <span className="flex items-center space-x-2">
                            <span>👁️</span>
                            <span>View Details</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Card Details */}
      {creditCardStep === 'details' && selectedCreditCard && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">💳</span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedCreditCard.name}</h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">{selectedCreditCard.issuer}</p>
                  {selectedCreditCard.student_friendly && (
                    <span className="inline-block mt-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                      🎓 Student-Friendly
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCreditCardStep('results')}
                className="flex items-center space-x-2 bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <span>←</span>
                <span>Back to Results</span>
              </button>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📋</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">Card Details</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Annual Fee:</span>
                    <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                      {selectedCreditCard.annual_fee === 0 ? 'FREE' : `$${selectedCreditCard.annual_fee}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">APR:</span>
                    <span className="font-bold text-lg text-blue-900 dark:text-blue-100">{selectedCreditCard.apr}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Credit Score Range:</span>
                    <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                      {selectedCreditCard.credit_score_min}-{selectedCreditCard.credit_score_max}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Approval Likelihood:</span>
                    <span className={`font-bold text-lg px-3 py-1 rounded-xl ${getLikelihoodColor(selectedCreditCard.approval_likelihood)}`}>
                      {getLikelihoodIcon(selectedCreditCard.approval_likelihood)} {selectedCreditCard.approval_likelihood.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">⭐</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">Rewards Program</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Rewards Type:</span>
                    <span className="font-bold text-lg text-green-900 dark:text-green-100 capitalize">
                      {selectedCreditCard.rewards.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Rewards Rate:</span>
                    <span className="font-bold text-lg text-green-900 dark:text-green-100">
                      {selectedCreditCard.rewards.rate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 rounded-xl">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Your Projected Annual Rewards:</span>
                    <span className="font-bold text-xl text-green-800 dark:text-green-200">
                      ${(creditCardAnswers.monthlySpending * 12 * selectedCreditCard.rewards.rate / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">✨</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Key Benefits & Perks</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCreditCard.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center space-x-6">
              <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <span className="flex items-center space-x-3">
                  <span className="text-xl">🚀</span>
                  <span>Apply Now</span>
                </span>
              </button>
              <button className="group border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105">
                <span className="flex items-center space-x-3">
                  <span className="text-xl">⚖️</span>
                  <span>Compare Cards</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
