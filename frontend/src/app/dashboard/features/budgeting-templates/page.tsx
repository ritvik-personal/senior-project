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
 * Categories include:
 * - Food & Dining
 * - Dorm Supplies
 * - Transportation
 * - Entertainment
 * - School Supplies
 * - Utilities
 */

"use client";

import { useState, useEffect } from "react";

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  categories: BudgetCategory[];
  monthlyIncome: number;
  savingsGoal: number;
}

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  allocatedAmount: number;
  spentAmount: number;
  percentage: number;
}

interface UserBudget {
  id: string;
  templateId: string;
  name: string;
  categories: BudgetCategory[];
  monthlyIncome: number;
  savingsGoal: number;
  createdAt: string;
}

export default function BudgetingTemplatesPage() {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [userBudgets, setUserBudgets] = useState<UserBudget[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [budgetName, setBudgetName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');

  // Pre-defined budget templates
  const defaultTemplates: BudgetTemplate[] = [
    {
      id: 'basic-student',
      name: 'Basic Student Budget',
      description: 'Essential categories for students living on campus',
      monthlyIncome: 1000,
      savingsGoal: 100,
      categories: [
        { id: 'food', name: 'Food & Dining', icon: '🍽️', color: 'bg-orange-100 text-orange-800', allocatedAmount: 300, spentAmount: 0, percentage: 30 },
        { id: 'supplies', name: 'School Supplies', icon: '📚', color: 'bg-green-100 text-green-800', allocatedAmount: 100, spentAmount: 0, percentage: 10 },
        { id: 'transport', name: 'Transportation', icon: '🚗', color: 'bg-blue-100 text-blue-800', allocatedAmount: 150, spentAmount: 0, percentage: 15 },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'bg-purple-100 text-purple-800', allocatedAmount: 100, spentAmount: 0, percentage: 10 },
        { id: 'utilities', name: 'Utilities', icon: '⚡', color: 'bg-yellow-100 text-yellow-800', allocatedAmount: 50, spentAmount: 0, percentage: 5 },
        { id: 'savings', name: 'Savings', icon: '💰', color: 'bg-emerald-100 text-emerald-800', allocatedAmount: 100, spentAmount: 0, percentage: 10 },
        { id: 'misc', name: 'Miscellaneous', icon: '📦', color: 'bg-gray-100 text-gray-800', allocatedAmount: 200, spentAmount: 0, percentage: 20 },
      ]
    },
    {
      id: 'off-campus',
      name: 'Off-Campus Living',
      description: 'Budget template for students living off-campus',
      monthlyIncome: 1500,
      savingsGoal: 200,
      categories: [
        { id: 'rent', name: 'Rent', icon: '🏠', color: 'bg-red-100 text-red-800', allocatedAmount: 600, spentAmount: 0, percentage: 40 },
        { id: 'food', name: 'Food & Dining', icon: '🍽️', color: 'bg-orange-100 text-orange-800', allocatedAmount: 300, spentAmount: 0, percentage: 20 },
        { id: 'utilities', name: 'Utilities', icon: '⚡', color: 'bg-yellow-100 text-yellow-800', allocatedAmount: 150, spentAmount: 0, percentage: 10 },
        { id: 'transport', name: 'Transportation', icon: '🚗', color: 'bg-blue-100 text-blue-800', allocatedAmount: 200, spentAmount: 0, percentage: 13 },
        { id: 'supplies', name: 'School Supplies', icon: '📚', color: 'bg-green-100 text-green-800', allocatedAmount: 100, spentAmount: 0, percentage: 7 },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'bg-purple-100 text-purple-800', allocatedAmount: 100, spentAmount: 0, percentage: 7 },
        { id: 'savings', name: 'Savings', icon: '💰', color: 'bg-emerald-100 text-emerald-800', allocatedAmount: 200, spentAmount: 0, percentage: 13 },
      ]
    },
    {
      id: 'minimal',
      name: 'Minimal Budget',
      description: 'Ultra-basic budget for students with limited income',
      monthlyIncome: 600,
      savingsGoal: 50,
      categories: [
        { id: 'food', name: 'Food & Dining', icon: '🍽️', color: 'bg-orange-100 text-orange-800', allocatedAmount: 200, spentAmount: 0, percentage: 33 },
        { id: 'supplies', name: 'School Supplies', icon: '📚', color: 'bg-green-100 text-green-800', allocatedAmount: 100, spentAmount: 0, percentage: 17 },
        { id: 'transport', name: 'Transportation', icon: '🚗', color: 'bg-blue-100 text-blue-800', allocatedAmount: 100, spentAmount: 0, percentage: 17 },
        { id: 'utilities', name: 'Utilities', icon: '⚡', color: 'bg-yellow-100 text-yellow-800', allocatedAmount: 50, spentAmount: 0, percentage: 8 },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'bg-purple-100 text-purple-800', allocatedAmount: 50, spentAmount: 0, percentage: 8 },
        { id: 'savings', name: 'Savings', icon: '💰', color: 'bg-emerald-100 text-emerald-800', allocatedAmount: 50, spentAmount: 0, percentage: 8 },
        { id: 'misc', name: 'Miscellaneous', icon: '📦', color: 'bg-gray-100 text-gray-800', allocatedAmount: 50, spentAmount: 0, percentage: 8 },
      ]
    }
  ];

  useEffect(() => {
    setTemplates(defaultTemplates);
  }, []);

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !budgetName || !monthlyIncome) return;

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const newBudget: UserBudget = {
      id: Date.now().toString(),
      templateId: selectedTemplate,
      name: budgetName,
      categories: template.categories.map(cat => ({
        ...cat,
        allocatedAmount: Math.round((cat.percentage / 100) * parseFloat(monthlyIncome))
      })),
      monthlyIncome: parseFloat(monthlyIncome),
      savingsGoal: parseFloat(savingsGoal) || 0,
      createdAt: new Date().toISOString(),
    };

    setUserBudgets([newBudget, ...userBudgets]);
    setBudgetName('');
    setMonthlyIncome('');
    setSavingsGoal('');
    setSelectedTemplate('');
    setShowCreateForm(false);
  };

  const getTotalAllocated = (budget: UserBudget) => {
    return budget.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  };

  const getRemainingAmount = (budget: UserBudget) => {
    return budget.monthlyIncome - getTotalAllocated(budget);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budgeting Templates</h2>
          <p className="text-gray-600 dark:text-gray-300">Ready-to-use financial frameworks for students</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Create Budget
        </button>
      </div>

      {/* Create Budget Form */}
      {showCreateForm && (
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
                  {budget.categories.map(category => (
                    <div key={category.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                          {category.percentage}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Allocated:</span>
                          <span className="font-medium">${category.allocatedAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Spent:</span>
                          <span className="font-medium">${category.spentAmount}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((category.spentAmount / category.allocatedAmount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Budget Summary */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Allocated</p>
                      <p className="font-bold text-gray-900 dark:text-white">${getTotalAllocated(budget)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Remaining</p>
                      <p className={`font-bold ${getRemainingAmount(budget) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${getRemainingAmount(budget)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Savings Goal</p>
                      <p className="font-bold text-gray-900 dark:text-white">${budget.savingsGoal}</p>
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Edit Budget
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {userBudgets.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Budgets Created Yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create your first budget using one of our student-friendly templates
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Your First Budget
          </button>
        </div>
      )}
    </div>
  );
}
