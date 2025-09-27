/**
 * Dashboard Page Component
 * 
 * This is the main dashboard for authenticated users of CampusFin.
 * Features:
 * - User authentication check and session management
 * - Feature toggle bar for easy navigation between platform features
 * - Financial overview cards with key metrics
 * - Quick action buttons for common tasks
 * - Responsive design with dark mode support
 * 
 * The dashboard serves as the central hub where users can access all
 * platform features including expense tracking, budgeting, wishlist,
 * credit card recommendations, and investment insights.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Import feature components
import ExpenseTrackingPage from "./features/expense-tracking/page";
import BudgetingTemplatesPage from "./features/budgeting-templates/page";
import SharedWishlistPage from "./features/shared-wishlist/page";
import CreditCardToolPage from "./features/credit-card-tool/page";
import InvestmentInsightsPage from "./features/investment-insights/page";

// Feature toggle types
type FeatureTab = 'overview' | 'expense-tracking' | 'budgeting-templates' | 'shared-wishlist' | 'credit-card-tool' | 'investment-insights';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeatureTab>('overview');

  useEffect(() => {
    // Check if user is logged in and verify token
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    
    if (userData && token) {
      setUser(JSON.parse(userData));
      
      // Optional: Verify token with backend
      // This could be implemented later for additional security
      // verifyTokenWithBackend(token);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint if token exists
      const token = localStorage.getItem("access_token");
      if (token) {
        await fetch("http://localhost:8000/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local storage and redirect
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Monthly Income</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💸</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Savings Goal</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveTab('expense-tracking')}
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">📱</span>
                    <p className="font-medium">Add Expense</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('budgeting-templates')}
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">📊</span>
                    <p className="font-medium">Create Budget</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('investment-insights')}
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">📈</span>
                    <p className="font-medium">Investment Insights</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'expense-tracking':
        return <ExpenseTrackingPage />;
      
      case 'budgeting-templates':
        return <BudgetingTemplatesPage />;
      
      case 'shared-wishlist':
        return <SharedWishlistPage />;
      
      case 'credit-card-tool':
        return <CreditCardToolPage />;
      
      case 'investment-insights':
        return <InvestmentInsightsPage />;
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please log in to access the dashboard.</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">CampusFin</span>
            </div>
            {/* Feature Toggle Bar */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab('expense-tracking')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'expense-tracking'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📱 Expenses
              </button>
              <button
                onClick={() => setActiveTab('budgeting-templates')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'budgeting-templates'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📊 Budget
              </button>
              <button
                onClick={() => setActiveTab('shared-wishlist')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'shared-wishlist'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                🛒 Wishlist
              </button>
              <button
                onClick={() => setActiveTab('credit-card-tool')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'credit-card-tool'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                💳 Cards
              </button>
              <button
                onClick={() => setActiveTab('investment-insights')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'investment-insights'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📈 Invest
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Welcome, {user.metadata?.name || user.email}!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your finances and track your progress
          </p>
        </div>

        {/* Dynamic Content Based on Active Tab */}
        {renderTabContent()}
      </main>
    </div>
  );
}
