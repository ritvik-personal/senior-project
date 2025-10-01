"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

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

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
}

export default function ExpenseTrackingPage() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("expenses") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseType, setExpenseType] = useState<"personal" | "group">("personal");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);

  const categories: Category[] = [
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
  ];

  // Load groups from localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem("groups");
    if (savedGroups) {
      try {
        setGroups(JSON.parse(savedGroups));
      } catch {
        setGroups([]);
      }
    }
  }, []);

  // Load expenses from backend or localStorage
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const token = api.getToken();
        if (!token) {
          const saved = localStorage.getItem("expenses");
          if (saved) {
            try {
              setExpenses(JSON.parse(saved));
            } catch {
              setExpenses([]);
            }
          }
          return;
        }

        const response = await api.get("expenses/?limit=100");
        const data = await response.json();

        const frontendExpenses: Expense[] = data.expenses.map((expense: any) => ({
          id: expense.id,
          amount: expense.amount_dollars,
          category: expense.category,
          description: expense.description || "",
          date: expense.created_at.split("T")[0],
          type: "personal",
        }));
        setExpenses(frontendExpenses);
      } catch (error) {
        console.error("Error loading expenses:", error);
        const saved = localStorage.getItem("expenses");
        if (saved) {
          try {
            setExpenses(JSON.parse(saved));
          } catch {
            setExpenses([]);
          }
        }
      }
    };

    loadExpenses();
  }, []);

  // Save to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleParticipantToggle = (member: string) => {
    setParticipants((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedCategory || !description || !expenseDate) return;

    try {
      const token = api.getToken();
      if (!token) {
        alert("Please log in to add expenses");
        return;
      }

      if (isEditing && editingExpenseId) {
        const updateData = {
          amount_dollars: parseFloat(amount),
          credit: false,
          category: selectedCategory,
          description,
          created_at: expenseDate,
        };
        const response = await api.put(`expenses/${editingExpenseId}`, updateData);
        const updated = await response.json();

        setExpenses((prev) =>
          prev.map((exp) =>
            exp.id === editingExpenseId
              ? {
                  ...exp,
                  amount: updated.amount_dollars,
                  category: updated.category,
                  description: updated.description || "",
                  date: expenseDate,
                }
              : exp
          )
        );
      } else {
        const expenseData = {
          amount_dollars: parseFloat(amount),
          credit: false,
          category: selectedCategory,
          description,
          created_at: expenseDate,
          group_id: expenseType === "group" ? selectedGroup : undefined,
          participants: expenseType === "group" ? participants : [],
        };

        const response = await api.post("expenses/", expenseData);
        const createdExpense = await response.json();

        const newExpense: Expense = {
          id: createdExpense.id,
          amount: createdExpense.amount_dollars,
          category: createdExpense.category,
          description: createdExpense.description || "",
          date: expenseDate,
          type: expenseType,
          groupId: selectedGroup || undefined,
          participants: expenseType === "group" ? participants : [],
        };

        setExpenses([newExpense, ...expenses]);
      }

      // reset form
      setAmount("");
      setDescription("");
      setSelectedCategory("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setSelectedGroup("");
      setParticipants([]);
      setShowAddForm(false);
      setIsEditing(false);
      setEditingExpenseId(null);
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Failed to create expense. Please try again.");
    }
  };

  // --- ADDED THIS FUNCTION BACK ---
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // For now, simulate OCR processing and create an expense
      // TODO: Implement actual OCR processing or file upload to backend
      setTimeout(async () => {
        try {
          // Check if user is authenticated
          const token = api.getToken();
          if (!token) {
            alert('Please log in to upload receipts');
            return;
          }

          const mockOCRData = {
            amount_dollars: 15.99,
            credit: false,
            category: "Food", // Use database category
            description: "Coffee and pastry from campus cafe"
            // metadata removed until database column is added
          };

          const response = await api.post('expenses/', mockOCRData);
          const createdExpense = await response.json();
          const newExpense: Expense = {
            id: createdExpense.id,
            amount: createdExpense.amount_dollars,
            category: createdExpense.category,
            description: createdExpense.description || "",
            date: new Date().toISOString().split("T")[0],
            type: "personal",
          };
          setExpenses([newExpense, ...expenses]);
          setShowUploadForm(false);
        } catch (error) {
          console.error('Error creating expense from receipt:', error);
          alert('Failed to process receipt. Please try again.');
        }
      }, 2000);
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Failed to process receipt. Please try again.');
    }
  };

  const handleEditClick = (expense: Expense) => {
    setIsEditing(true);
    setEditingExpenseId(expense.id);
    setAmount(String(expense.amount));
    setSelectedCategory(expense.category);
    setDescription(expense.description);
    setExpenseDate(expense.date);
    setExpenseType(expense.type);
    setSelectedGroup(expense.groupId || "");
    setParticipants(expense.participants || []);
    setShowAddForm(true);
  };

  const handleDeleteClick = async (expenseId: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const token = api.getToken();
      if (!token) {
        alert("Please log in to delete expenses");
        return;
      }
      await api.delete(`expenses/${expenseId}`);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense. Please try again.");
    }
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
          <p className="text-gray-600 dark:text-gray-300">
            Track your personal and group expenses
          </p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {expenses.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {isEditing ? "Edit Expense" : "Add New Expense"}
          </h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            {/* Line 1: Amount, Category, Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
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
            </div>

            {/* Line 2: Description */}
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

            {/* Line 3: Expense Type & Group Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
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
                    Group
                  </label>
                </div>
              </div>
              {expenseType === "group" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Group
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  >
                    <option value="">Select group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Line 4: Participants (only if group selected) */}
            {expenseType === "group" && selectedGroup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Participants
                </label>
                <div className="flex flex-wrap gap-3">
                  {groups
                    .find((g) => g.id === selectedGroup)
                    ?.members.map((member) => (
                      <label key={member} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={participants.includes(member)}
                          onChange={() => handleParticipantToggle(member)}
                        />
                        <span>{member}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Form Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setIsEditing(false);
                  setEditingExpenseId(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {isEditing ? "Save Changes" : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADDED THIS JSX BLOCK BACK --- */}
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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Expenses
        </h3>
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
                      <p className="font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {category?.name} • {expense.date} • {expense.type}
                      </p>
                      {expense.type === "group" && expense.groupId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Group: {groups.find((g) => g.id === expense.groupId)?.name || "Unknown"}
                          {expense.participants?.length
                            ? ` • Participants: ${expense.participants.join(", ")}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleEditClick(expense)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(expense.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                    <p className="font-bold text-gray-900 dark:text-white">
                      ${expense.amount.toFixed(2)}
                    </p>
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
