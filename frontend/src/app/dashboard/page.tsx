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
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";
import TopNav from "../components/TopNav";

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
  const [monthlyExpensesTotal, setMonthlyExpensesTotal] = useState<number>(0);
  const [overallExpensesTotal, setOverallExpensesTotal] = useState<number>(0);
  const searchParams = useSearchParams();
  const router = useRouter();


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

    // Initialize tab from URL if provided
    const tabParam = searchParams?.get('tab') as FeatureTab | null;
    if (tabParam && [
      'overview', 'expense-tracking', 'budgeting-templates', 'shared-wishlist', 'credit-card-tool', 'investment-insights'
    ].includes(tabParam)) {
      setActiveTab(tabParam as FeatureTab);
    }

    setIsLoading(false);
  }, []);

  // Load this month's expenses total from backend
  useEffect(() => {
    const fetchMonthlyExpenses = async () => {
      try {
        const token = api.getToken();
        if (!token) return;
        const response = await api.get(`expenses/sum/monthly`);
        const data = await response.json();
        const total = typeof data.total_amount === 'number' ? data.total_amount : 0;
        setMonthlyExpensesTotal(total);
      } catch (err) {
        console.error('Failed to fetch monthly expenses total:', err);
      }
    };

    fetchMonthlyExpenses();
  }, []);

  // Load overall expenses total from backend
  useEffect(() => {
    const fetchOverallExpenses = async () => {
      try {
        const token = api.getToken();
        if (!token) return;
        const response = await api.get(`expenses/sum/overall`);
        const data = await response.json();
        const total = typeof data.total_amount === 'number' ? data.total_amount : 0;
        setOverallExpensesTotal(total);
      } catch (err) {
        console.error('Failed to fetch overall expenses total:', err);
      }
    };

    fetchOverallExpenses();
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
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${overallExpensesTotal.toFixed(2)}</p>
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${monthlyExpensesTotal.toFixed(2)}</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <Link
                  href="/expenses"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
                >
                  <span className="text-3xl mb-2 block">📱</span>
                  <span className="font-medium">Expense Tracking</span>
                </Link>

                <Link
                  href="/budgeting-templates"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center"
                >
                  <span className="text-3xl mb-2 block">📊</span>
                  <span className="font-medium">Budget Templates</span>
                </Link>

                <Link
                  href="/wishlist"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors text-center"
                >
                  <span className="text-3xl mb-2 block">🛒</span>
                  <span className="font-medium">Shared Wishlist</span>
                </Link>

                <Link
                  href="/credit-cards"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors text-center"
                >
                  <span className="text-3xl mb-2 block">💳</span>
                  <span className="font-medium">Credit Cards</span>
                </Link>

                <Link
                  href="/investment-insights"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center"
                >
                  <span className="text-3xl mb-2 block">📈</span>
                  <span className="font-medium">Investment Insights</span>
                </Link>

                <Link
                  href="/group-settling"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-center"
                >
                  <span className="text-3xl mb-2 block">💰</span>
                  <p className="font-medium">Group Settling</p>
                </Link>

                <Link
                  href="/groups"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-center"
                >
                  <span className="text-3xl mb-2 block">👥</span>
                  <p className="font-medium">Manage Groups</p>
                </Link>
              </div>
            </div>

          </div>
        );

      case 'expense-tracking':
        return (
          <ExpenseTrackingPage
            initialShowAddForm={searchParams?.get('openAddExpense') === '1'}
          />
        );

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
      <TopNav />

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
