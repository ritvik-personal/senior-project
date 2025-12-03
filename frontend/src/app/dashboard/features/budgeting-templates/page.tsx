/**
 * Budgeting Templates Page Component
 * 
 * This component provides ready-to-use financial frameworks tailored for students.
 * Features:
 * - Pre-built budget templates for common student categories
 * - Customizable templates for food, dorm supplies, transportation, entertainment
 * - Spending goal tracking and progress monitoring
 * - Budget vs actual spending comparisons
 * - Monthly budget planning and adjustments
 * 
 * Categories match the expense tracking categories for consistency.
 */

"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  categories: BudgetCategory[];
  monthlyIncome: number;
  savingsGoal: number;
}

interface BudgetCategory {
  category: string; // Must match backend ExpenseCategory enum values
  allocatedAmount: number;
  spentAmount: number;
  percentage: number;
  // UI metadata
  icon?: string;
  color?: string;
  displayName?: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface UserBudget {
  id: string;
  template_id?: string;
  name: string;
  categories: BudgetCategory[];
  monthlyIncome: number;
  savingsGoal: number;
  createdAt: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
}

export default function BudgetingTemplatesPage() {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [userBudgets, setUserBudgets] = useState<UserBudget[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [budgetName, setBudgetName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<UserBudget | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Category mapping helper
  const getCategoryInfo = (categoryName: string): CategoryInfo | undefined => {
    return categories.find(cat => cat.name === categoryName);
  };

  // Pre-defined budget templates using valid backend category names
  const defaultTemplates: BudgetTemplate[] = [
    {
      id: 'basic-student',
      name: 'Basic Student Budget',
      description: 'Essential categories for students living on campus',
      monthlyIncome: 1000,
      savingsGoal: 100,
      categories: [
        { category: 'Food', allocatedAmount: 300, spentAmount: 0, percentage: 30 },
        { category: 'Personal Care', allocatedAmount: 100, spentAmount: 0, percentage: 10 },
        { category: 'Transportation', allocatedAmount: 150, spentAmount: 0, percentage: 15 },
        { category: 'Recreation', allocatedAmount: 100, spentAmount: 0, percentage: 10 },
        { category: 'Utilities', allocatedAmount: 50, spentAmount: 0, percentage: 5 },
        { category: 'Debts', allocatedAmount: 100, spentAmount: 0, percentage: 10 },
        { category: 'Clothing', allocatedAmount: 200, spentAmount: 0, percentage: 20 },
      ]
    },
    {
      id: 'off-campus',
      name: 'Off-Campus Living',
      description: 'Budget template for students living off-campus',
      monthlyIncome: 1500,
      savingsGoal: 200,
      categories: [
        { category: 'Housing', allocatedAmount: 600, spentAmount: 0, percentage: 40 },
        { category: 'Food', allocatedAmount: 300, spentAmount: 0, percentage: 20 },
        { category: 'Utilities', allocatedAmount: 150, spentAmount: 0, percentage: 10 },
        { category: 'Transportation', allocatedAmount: 200, spentAmount: 0, percentage: 13 },
        { category: 'Personal Care', allocatedAmount: 100, spentAmount: 0, percentage: 7 },
        { category: 'Recreation', allocatedAmount: 100, spentAmount: 0, percentage: 7 },
        { category: 'Debts', allocatedAmount: 200, spentAmount: 0, percentage: 13 },
      ]
    },
    {
      id: 'minimal',
      name: 'Minimal Budget',
      description: 'Ultra-basic budget for students with limited income',
      monthlyIncome: 600,
      savingsGoal: 50,
      categories: [
        { category: 'Food', allocatedAmount: 200, spentAmount: 0, percentage: 33 },
        { category: 'Personal Care', allocatedAmount: 100, spentAmount: 0, percentage: 17 },
        { category: 'Transportation', allocatedAmount: 100, spentAmount: 0, percentage: 17 },
        { category: 'Utilities', allocatedAmount: 50, spentAmount: 0, percentage: 8 },
        { category: 'Recreation', allocatedAmount: 50, spentAmount: 0, percentage: 8 },
        { category: 'Debts', allocatedAmount: 50, spentAmount: 0, percentage: 8 },
        { category: 'Clothing', allocatedAmount: 50, spentAmount: 0, percentage: 8 },
      ]
    }
  ];

  // Load categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('budgets/categories/list');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to hardcoded categories if API fails
        setCategories([
          { id: "Food", name: "Food", icon: "🍽️", color: "bg-orange-100 text-orange-800" },
          { id: "Transportation", name: "Transportation", icon: "🚗", color: "bg-blue-100 text-blue-800" },
          { id: "Recreation", name: "Recreation", icon: "🎬", color: "bg-purple-100 text-purple-800" },
          { id: "Housing", name: "Housing", icon: "🏠", color: "bg-red-100 text-red-800" },
          { id: "Utilities", name: "Utilities", icon: "⚡", color: "bg-yellow-100 text-yellow-800" },
          { id: "Personal Care", name: "Personal Care", icon: "🧴", color: "bg-pink-100 text-pink-800" },
          { id: "Saving", name: "Saving", icon: "💰", color: "bg-emerald-100 text-emerald-800" },
          { id: "Debts", name: "Debts", icon: "💳", color: "bg-red-100 text-red-800" },
          { id: "Clothing", name: "Clothing", icon: "👕", color: "bg-indigo-100 text-indigo-800" },
          { id: "Paycheck", name: "Paycheck", icon: "💵", color: "bg-green-100 text-green-800" },
        ]);
      }
    };
    loadCategories();
    setTemplates(defaultTemplates);
  }, []);

  // Load user budgets from backend
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = api.getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await api.get('budgets/');
        const data = await response.json();
        
        // Map backend response to frontend format
        // Convert snake_case from backend to camelCase for frontend
        const budgets: UserBudget[] = data.budgets.map((budget: any) => ({
          id: budget.id,
          template_id: budget.template_id,
          name: budget.name,
          categories: (budget.categories || []).map((cat: any) => ({
            category: cat.category,
            allocatedAmount: cat.allocated_amount || cat.allocatedAmount || 0,
            spentAmount: cat.spent_amount || cat.spentAmount || 0,
            percentage: cat.percentage || 0,
          })),
          monthlyIncome: budget.monthly_income,
          savingsGoal: budget.savings_goal,
          createdAt: budget.created_at,
          updated_at: budget.updated_at,
          start_date: budget.start_date,
          end_date: budget.end_date,
        }));
        
        setUserBudgets(budgets);
      } catch (error) {
        console.error('Error loading budgets:', error);
        setError('Failed to load budgets. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadBudgets();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !budgetName || !monthlyIncome) return;

    try {
      setError(null);
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) return;

      // Map template categories to budget categories with recalculated amounts
      // Use snake_case to match backend Pydantic schema
      const budgetCategories = template.categories.map(cat => ({
        category: cat.category,
        allocated_amount: Math.round((cat.percentage / 100) * parseFloat(monthlyIncome)),
        spent_amount: 0,
        percentage: cat.percentage
      }));

      const budgetData = {
        name: budgetName,
        monthly_income: parseFloat(monthlyIncome),
        savings_goal: parseFloat(savingsGoal) || 0,
        categories: budgetCategories,
        template_id: selectedTemplate,
      };

      const response = await api.post('budgets/', budgetData);
      const createdBudget = await response.json();

      // Map to frontend format (convert snake_case to camelCase)
      const newBudget: UserBudget = {
        id: createdBudget.id,
        template_id: createdBudget.template_id,
        name: createdBudget.name,
        categories: (createdBudget.categories || []).map((cat: any) => ({
          category: cat.category,
          allocatedAmount: cat.allocated_amount || cat.allocatedAmount || 0,
          spentAmount: cat.spent_amount || cat.spentAmount || 0,
          percentage: cat.percentage || 0,
        })),
        monthlyIncome: createdBudget.monthly_income,
        savingsGoal: createdBudget.savings_goal,
        createdAt: createdBudget.created_at,
        updated_at: createdBudget.updated_at,
        start_date: createdBudget.start_date,
        end_date: createdBudget.end_date,
      };

      setUserBudgets([newBudget, ...userBudgets]);
      setBudgetName('');
      setMonthlyIncome('');
      setSavingsGoal('');
      setSelectedTemplate('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      setError('Failed to create budget. Please try again.');
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    try {
      setError(null);
      const response = await api.put(`budgets/${editingBudget.id}`, {
        name: budgetName,
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
        savings_goal: savingsGoal ? parseFloat(savingsGoal) : undefined,
      });

      const updatedBudget = await response.json();
      
      // Map to frontend format (convert snake_case to camelCase)
      const updated: UserBudget = {
        id: updatedBudget.id,
        template_id: updatedBudget.template_id,
        name: updatedBudget.name,
        categories: (updatedBudget.categories || editingBudget.categories || []).map((cat: any) => ({
          category: cat.category,
          allocatedAmount: cat.allocated_amount || cat.allocatedAmount || 0,
          spentAmount: cat.spent_amount || cat.spentAmount || 0,
          percentage: cat.percentage || 0,
        })),
        monthlyIncome: updatedBudget.monthly_income || editingBudget.monthlyIncome,
        savingsGoal: updatedBudget.savings_goal || editingBudget.savingsGoal,
        createdAt: updatedBudget.created_at || editingBudget.createdAt,
        updated_at: updatedBudget.updated_at,
        start_date: updatedBudget.start_date,
        end_date: updatedBudget.end_date,
      };

      setUserBudgets(userBudgets.map(b => b.id === updated.id ? updated : b));
      setEditingBudget(null);
      setShowEditForm(false);
      setBudgetName('');
      setMonthlyIncome('');
      setSavingsGoal('');
    } catch (error) {
      console.error('Error updating budget:', error);
      setError('Failed to update budget. Please try again.');
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      setError(null);
      await api.delete(`budgets/${budgetId}`);
      setUserBudgets(userBudgets.filter(b => b.id !== budgetId));
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget. Please try again.');
    }
  };

  const handleEditClick = (budget: UserBudget) => {
    setEditingBudget(budget);
    setBudgetName(budget.name);
    setMonthlyIncome(budget.monthlyIncome.toString());
    setSavingsGoal(budget.savingsGoal.toString());
    setShowEditForm(true);
    setShowCreateForm(false);
    // Scroll to edit form after a brief delay to ensure it's rendered
    setTimeout(() => {
      const editForm = document.getElementById('edit-budget-form');
      if (editForm) {
        editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
    setShowEditForm(false);
    setBudgetName('');
    setMonthlyIncome('');
    setSavingsGoal('');
  };

  const getTotalAllocated = (budget: UserBudget) => {
    return budget.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  };

  const getTotalSpent = (budget: UserBudget) => {
    return budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  };

  const getRemainingAmount = (budget: UserBudget) => {
    return budget.monthlyIncome - getTotalAllocated(budget);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budgeting Templates</h2>
          <p className="text-gray-600 dark:text-gray-300">Ready-to-use financial frameworks for students</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setShowEditForm(false);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Create Budget
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Create Budget Form */}
      {showCreateForm && !showEditForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Budget</h3>
          <form onSubmit={handleCreateBudget} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Name
                </label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., My Monthly Budget"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Income ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Savings Goal ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Budget Form */}
      {showEditForm && editingBudget && (
        <div id="edit-budget-form" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Budget</h3>
          <form onSubmit={handleUpdateBudget} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Name
                </label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Income ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Savings Goal ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Available Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{template.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Monthly Income:</span>
                  <span className="font-medium">${template.monthlyIncome}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Savings Goal:</span>
                  <span className="font-medium">${template.savingsGoal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Categories:</span>
                  <span className="font-medium">{template.categories.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Budgets */}
      {userBudgets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Budgets</h3>
          <div className="space-y-6">
            {userBudgets.map(budget => (
              <div key={budget.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{budget.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Created {new Date(budget.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Monthly Income</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">${budget.monthlyIncome}</p>
                  </div>
                </div>

                {/* Budget Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {budget.categories.map((category, index) => {
                    const categoryInfo = getCategoryInfo(category.category);
                    const icon = categoryInfo?.icon || '📦';
                    const color = categoryInfo?.color || 'bg-gray-100 text-gray-800';
                    const displayName = categoryInfo?.name || category.category;
                    
                    return (
                      <div key={`${category.category}-${index}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{icon}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                            {category.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Allocated:</span>
                            <span className="font-medium">${category.allocatedAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Spent:</span>
                            <span className="font-medium">${category.spentAmount.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                category.spentAmount > category.allocatedAmount 
                                  ? 'bg-red-600' 
                                  : category.spentAmount > category.allocatedAmount * 0.8
                                  ? 'bg-yellow-600'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min((category.spentAmount / category.allocatedAmount) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Budget Summary */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Allocated</p>
                      <p className="font-bold text-gray-900 dark:text-white">${getTotalAllocated(budget).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Spent</p>
                      <p className={`font-bold ${getTotalSpent(budget) > getTotalAllocated(budget) ? 'text-red-600' : 'text-blue-600'}`}>
                        ${getTotalSpent(budget).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Savings Goal</p>
                      <p className="font-bold text-gray-900 dark:text-white">${budget.savingsGoal.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditClick(budget)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {userBudgets.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Budgets Created Yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create your first budget using one of our student-friendly templates
          </p>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setShowEditForm(false);
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Your First Budget
          </button>
        </div>
      )}
    </div>
  );
}
