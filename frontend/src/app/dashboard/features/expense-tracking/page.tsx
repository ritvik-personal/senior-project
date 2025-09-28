"use client";

import { useState, useEffect } from "react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "personal" | "group";
  groupId?: string;
  participants?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function ExpenseTrackingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseType, setExpenseType] = useState<"personal" | "group">("personal");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const categories: Category[] = [
    { id: "food", name: "Food & Dining", icon: "🍽️", color: "bg-orange-100 text-orange-800" },
    { id: "transport", name: "Transportation", icon: "🚗", color: "bg-blue-100 text-blue-800" },
    { id: "entertainment", name: "Entertainment", icon: "🎬", color: "bg-purple-100 text-purple-800" },
    { id: "supplies", name: "School Supplies", icon: "📚", color: "bg-green-100 text-green-800" },
    { id: "utilities", name: "Utilities", icon: "⚡", color: "bg-yellow-100 text-yellow-800" },
    { id: "other", name: "Other", icon: "📦", color: "bg-gray-100 text-gray-800" },
  ];

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("expenses");
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch {
        setExpenses([]);
      }
    }
  }, []);

  // Save to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedCategory || !description || !expenseDate) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      category: selectedCategory,
      description,
      date: expenseDate,
      type: expenseType,
    };

    setExpenses([newExpense, ...expenses]);
    setAmount("");
    setDescription("");
    setSelectedCategory("");
    setExpenseDate(new Date().toISOString().split("T")[0]); // reset to today as a default value for a "new expense"
    setShowAddForm(false);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate OCR processing
    setTimeout(() => {
      const mockOCRResult: Expense = {
        id: Date.now().toString(),
        amount: 15.99,
        category: "food",
        description: "Coffee and pastry from campus cafe",
        date: new Date().toISOString().split("T")[0],
        type: "personal",
      };
      setExpenses([mockOCRResult, ...expenses]);
      setShowUploadForm(false);
    }, 2000);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);
      const currentMonth = new Date().getMonth();
      return expenseDate.getMonth() === currentMonth;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Tracking</h2>
          <p className="text-gray-600 dark:text-gray-300">Track your personal and group expenses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📷 Upload Receipt
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${monthlyExpenses.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{expenses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Expense</h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What was this expense for?"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expense Type
                </label>
                <div className="flex items-center h-full space-x-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="personal"
                      checked={expenseType === "personal"}
                      onChange={(e) => setExpenseType(e.target.value as "personal" | "group")}
                      className="mr-2"
                    />
                    Personal
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="group"
                      checked={expenseType === "group"}
                      onChange={(e) => setExpenseType(e.target.value as "personal" | "group")}
                      className="mr-2"
                    />
                    Group/Roommate
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Receipt Upload */}
      {showUploadForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Receipt</h3>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="hidden"
              id="receipt-upload"
            />
            <label htmlFor="receipt-upload" className="cursor-pointer">
              <span className="text-6xl mb-4 block">📷</span>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Click to upload receipt
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                OCR will automatically extract expense details
              </p>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowUploadForm(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Expenses</h3>
        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block">📱</span>
            <p className="text-gray-600 dark:text-gray-300">No expenses recorded yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add your first expense to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const category = categories.find((cat) => cat.id === expense.category);
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${category?.color}`}
                    >
                      <span className="text-lg">{category?.icon}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{expense.description}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {category?.name} • {expense.date} • {expense.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">${expense.amount.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
