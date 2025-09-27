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

import { useState, useEffect } from "react";

interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  type: 'student' | 'cashback' | 'travel' | 'building' | 'premium';
  annualFee: number;
  apr: number;
  creditScoreMin: number;
  creditScoreMax: number;
  rewards: {
    type: 'cashback' | 'points' | 'miles';
    rate: number;
    categories: string[];
  };
  perks: string[];
  approvalLikelihood: 'low' | 'medium' | 'high';
  studentFriendly: boolean;
  description: string;
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
  const [currentStep, setCurrentStep] = useState<'questionnaire' | 'results' | 'details'>('questionnaire');
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
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
  const [recommendations, setRecommendations] = useState<CreditCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);

  // Sample credit card database
  const creditCards: CreditCard[] = [
    {
      id: '1',
      name: 'Discover it Student Cash Back',
      issuer: 'Discover',
      type: 'student',
      annualFee: 0,
      apr: 18.99,
      creditScoreMin: 300,
      creditScoreMax: 850,
      rewards: {
        type: 'cashback',
        rate: 5,
        categories: ['Rotating categories', 'All other purchases']
      },
      perks: ['Good Grades Reward', 'No annual fee', 'Cashback match first year'],
      approvalLikelihood: 'high',
      studentFriendly: true,
      description: 'Perfect for students building credit with rotating 5% cashback categories.'
    },
    {
      id: '2',
      name: 'Capital One SavorOne Student',
      issuer: 'Capital One',
      type: 'student',
      annualFee: 0,
      apr: 19.99,
      creditScoreMin: 300,
      creditScoreMax: 850,
      rewards: {
        type: 'cashback',
        rate: 3,
        categories: ['Dining', 'Entertainment', 'Streaming']
      },
      perks: ['No foreign transaction fees', 'No annual fee', 'Student-friendly'],
      approvalLikelihood: 'high',
      studentFriendly: true,
      description: 'Great for students who spend on dining and entertainment.'
    },
    {
      id: '3',
      name: 'Chase Freedom Student',
      issuer: 'Chase',
      type: 'student',
      annualFee: 0,
      apr: 20.99,
      creditScoreMin: 300,
      creditScoreMax: 850,
      rewards: {
        type: 'cashback',
        rate: 1,
        categories: ['All purchases']
      },
      perks: ['No annual fee', 'Credit monitoring', 'Student rewards'],
      approvalLikelihood: 'medium',
      studentFriendly: true,
      description: 'Simple cashback card for students starting their credit journey.'
    },
    {
      id: '4',
      name: 'Citi Double Cash',
      issuer: 'Citi',
      type: 'cashback',
      annualFee: 0,
      apr: 19.99,
      creditScoreMin: 670,
      creditScoreMax: 850,
      rewards: {
        type: 'cashback',
        rate: 2,
        categories: ['All purchases']
      },
      perks: ['No annual fee', '2% on everything', 'No categories to track'],
      approvalLikelihood: 'medium',
      studentFriendly: false,
      description: 'Excellent flat-rate cashback card for consistent spending.'
    },
    {
      id: '5',
      name: 'Chase Sapphire Preferred',
      issuer: 'Chase',
      type: 'travel',
      annualFee: 95,
      apr: 21.99,
      creditScoreMin: 690,
      creditScoreMax: 850,
      rewards: {
        type: 'points',
        rate: 2,
        categories: ['Travel', 'Dining']
      },
      perks: ['60k bonus points', 'Travel protection', 'Transfer partners'],
      approvalLikelihood: 'low',
      studentFriendly: false,
      description: 'Premium travel rewards card with excellent benefits.'
    }
  ];

  const spendingCategories = [
    'Dining & Restaurants',
    'Groceries',
    'Gas & Transportation',
    'Entertainment',
    'Shopping',
    'Travel',
    'Utilities',
    'Education',
    'Healthcare'
  ];

  const handleAnswerChange = (field: keyof QuestionnaireAnswers, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field: keyof QuestionnaireAnswers['preferences'], value: any) => {
    setAnswers(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setAnswers(prev => ({
      ...prev,
      spendingCategories: prev.spendingCategories.includes(category)
        ? prev.spendingCategories.filter(c => c !== category)
        : [...prev.spendingCategories, category]
    }));
  };

  const calculateRecommendations = () => {
    let filtered = creditCards.filter(card => {
      // Credit score filter
      if (answers.creditScore < card.creditScoreMin || answers.creditScore > card.creditScoreMax) {
        return false;
      }

      // Student preference filter
      if (answers.preferences.studentFriendly && !card.studentFriendly) {
        return false;
      }

      // Annual fee preference filter
      if (answers.preferences.annualFee === 'none' && card.annualFee > 0) {
        return false;
      }

      return true;
    });

    // Sort by approval likelihood and student friendliness
    filtered.sort((a, b) => {
      const likelihoodOrder = { high: 3, medium: 2, low: 1 };
      const aScore = likelihoodOrder[a.approvalLikelihood] + (a.studentFriendly ? 1 : 0);
      const bScore = likelihoodOrder[b.approvalLikelihood] + (b.studentFriendly ? 1 : 0);
      return bScore - aScore;
    });

    setRecommendations(filtered);
    setCurrentStep('results');
  };

  const calculateProjectedRewards = (card: CreditCard) => {
    const annualSpending = answers.monthlySpending * 12;
    let rewards = 0;

    if (card.rewards.type === 'cashback') {
      rewards = (annualSpending * card.rewards.rate) / 100;
    } else if (card.rewards.type === 'points') {
      rewards = (annualSpending * card.rewards.rate) / 100;
    }

    return rewards;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Credit Card 'Fit' Tool</h2>
          <p className="text-gray-600 dark:text-gray-300">Find the perfect credit card for your student lifestyle</p>
        </div>
        {currentStep !== 'questionnaire' && (
          <button
            onClick={() => setCurrentStep('questionnaire')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Retake Quiz
          </button>
        )}
      </div>

      {/* Questionnaire */}
      {currentStep === 'questionnaire' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Credit Card Questionnaire</h3>
          
          <div className="space-y-8">
            {/* Credit Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What's your credit score range?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { range: '300-579', value: 450, label: 'Poor' },
                  { range: '580-669', value: 625, label: 'Fair' },
                  { range: '670-739', value: 705, label: 'Good' },
                  { range: '740+', value: 750, label: 'Excellent' }
                ].map(score => (
                  <button
                    key={score.value}
                    onClick={() => handleAnswerChange('creditScore', score.value)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      answers.creditScore === score.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{score.range}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{score.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Spending */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How much do you typically spend per month on your credit card?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { range: '$0-500', value: 250 },
                  { range: '$500-1000', value: 750 },
                  { range: '$1000-2000', value: 1500 },
                  { range: '$2000+', value: 2500 }
                ].map(spending => (
                  <button
                    key={spending.value}
                    onClick={() => handleAnswerChange('monthlySpending', spending.value)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      answers.monthlySpending === spending.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{spending.range}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Spending Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select your top spending categories (choose all that apply):
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {spendingCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      answers.spendingCategories.includes(category)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What type of rewards do you prefer?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'cashback', label: 'Cash Back', icon: '💰' },
                    { value: 'points', label: 'Points', icon: '⭐' },
                    { value: 'miles', label: 'Miles', icon: '✈️' }
                  ].map(reward => (
                    <button
                      key={reward.value}
                      onClick={() => handlePreferenceChange('rewards', reward.value)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        answers.preferences.rewards === reward.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{reward.icon}</div>
                      <div className="font-medium text-gray-900 dark:text-white">{reward.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual fee preference:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'none', label: 'No Annual Fee', icon: '🆓' },
                    { value: 'low', label: 'Low Fee ($0-50)', icon: '💵' },
                    { value: 'any', label: 'Any Fee', icon: '💎' }
                  ].map(fee => (
                    <button
                      key={fee.value}
                      onClick={() => handlePreferenceChange('annualFee', fee.value)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        answers.preferences.annualFee === fee.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{fee.icon}</div>
                      <div className="font-medium text-gray-900 dark:text-white">{fee.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={answers.preferences.buildingCredit}
                    onChange={(e) => handlePreferenceChange('buildingCredit', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">I'm focused on building credit</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={answers.preferences.studentFriendly}
                    onChange={(e) => handlePreferenceChange('studentFriendly', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Student-friendly features important</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                onClick={calculateRecommendations}
                disabled={answers.creditScore === 0 || answers.monthlySpending === 0}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Find My Perfect Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {currentStep === 'results' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Credit Card Recommendations</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Based on your preferences, here are the best credit cards for you:
            </p>

            <div className="space-y-4">
              {recommendations.map((card, index) => (
                <div key={card.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{card.name}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{card.issuer}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLikelihoodColor(card.approvalLikelihood)}`}>
                        {getLikelihoodIcon(card.approvalLikelihood)} {card.approvalLikelihood.toUpperCase()} APPROVAL
                      </div>
                      {card.studentFriendly && (
                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">🎓 Student-Friendly</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Annual Fee</div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {card.annualFee === 0 ? 'FREE' : `$${card.annualFee}`}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Rewards Rate</div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {card.rewards.rate}% {card.rewards.type}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Projected Annual Rewards</div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        ${calculateProjectedRewards(card).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Perks:</div>
                    <div className="flex flex-wrap gap-2">
                      {card.perks.map((perk, idx) => (
                        <span key={idx} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      APR: {card.apr}% • Credit Score: {card.creditScoreMin}-{card.creditScoreMax}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCard(card);
                        setCurrentStep('details');
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card Details */}
      {currentStep === 'details' && selectedCard && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCard.name}</h3>
              <p className="text-gray-600 dark:text-gray-300">{selectedCard.issuer}</p>
            </div>
            <button
              onClick={() => setCurrentStep('results')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              ← Back to Results
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Card Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Annual Fee:</span>
                  <span className="font-medium">{selectedCard.annualFee === 0 ? 'FREE' : `$${selectedCard.annualFee}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">APR:</span>
                  <span className="font-medium">{selectedCard.apr}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Credit Score Range:</span>
                  <span className="font-medium">{selectedCard.creditScoreMin}-{selectedCard.creditScoreMax}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Approval Likelihood:</span>
                  <span className={`font-medium ${getLikelihoodColor(selectedCard.approvalLikelihood)} px-2 py-1 rounded-full text-xs`}>
                    {getLikelihoodIcon(selectedCard.approvalLikelihood)} {selectedCard.approvalLikelihood.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Rewards Program</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Rewards Type:</span>
                  <span className="font-medium capitalize">{selectedCard.rewards.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Rewards Rate:</span>
                  <span className="font-medium">{selectedCard.rewards.rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Your Projected Annual Rewards:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${calculateProjectedRewards(selectedCard).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Benefits & Perks</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedCard.perks.map((perk, idx) => (
                <div key={idx} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-900 dark:text-white">{perk}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Apply Now
            </button>
            <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Compare Cards
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
