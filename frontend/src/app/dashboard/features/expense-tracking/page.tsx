"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
// 1. ADDED helper function to get user ID from the auth token
function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch (error) {
    console.error("Failed to parse token:", error);
    return null;
  }
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "personal" | "group";
  groupId?: string;
  participants?: string[];
  credit?: boolean; // If true, this is income/revenue and should be subtracted from expenses
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

interface MemberInfo {
  user_id: string;
  email?: string;
}


export default function ExpenseTrackingPage({ initialShowAddForm = false }: { initialShowAddForm?: boolean }) {
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
  const [memberInfos, setMemberInfos] = useState<MemberInfo[]>([]);

  // State to manage the visibility of the new participant dropdown
  const [isParticipantDropdownOpen, setIsParticipantDropdownOpen] = useState(false);

  // 2. ADDED state to store the current user's ID
  const [userId, setUserId] = useState<string | null>(null);

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

  // This new useEffect gets the user's ID when the page loads
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      const id = getUserIdFromToken(token);
      setUserId(id);
    }
    // No 'else' needed, as other functions already handle the non-logged-in case
  }, []);

  // Open Add Expense form if requested by parent
  useEffect(() => {
    if (initialShowAddForm) {
      setShowAddForm(true);
    }
  }, [initialShowAddForm]);

  // Load user's groups from backend on initial load and when expense type switches to group
  useEffect(() => {
    const loadUserGroups = async () => {
      try {
        const token = api.getToken();
        if (!token) return;
        const resp = await api.get("groups/my-groups");
        const data = await resp.json();
        // Map backend schema to local Group interface
        const mapped: Group[] = (data.groups || []).map((g: any) => ({
          id: g.group_id,
          name: g.group_name,
          description: g.group_description || "",
          members: [], // fetched separately when a group is selected
        }));
        setGroups(mapped);
      } catch (e) {
        console.error("Failed to load user groups:", e);
        setGroups([]);
      }
    };

    // Always load groups on mount, and also when expense type switches to group
    loadUserGroups();
  }, [expenseType]);

  // Load members for the selected group to populate participants dropdown
  useEffect(() => {
    const loadGroupMembers = async () => {
      try {
        if (!selectedGroup) return;
        const resp = await api.get(`groups/${selectedGroup}/members?exclude_self=true`);
        const data = await resp.json();
        // data is [{ user_id, is_admin, joined_at, email? }]
        const memberIds = (data || []).map((m: any) => m.user_id);
        setGroups(prev => prev.map(g => g.id === selectedGroup ? { ...g, members: memberIds } : g));
        setMemberInfos((data || []).map((m: any) => ({ user_id: m.user_id, email: m.email })));
      } catch (e) {
        console.error("Failed to load group members:", e);
      }
    };

    if (expenseType === "group" && selectedGroup) {
      loadGroupMembers();
    }
  }, [expenseType, selectedGroup]);

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
        
        // Debug: Log expenses to see credit field
        console.log("Loaded expenses from backend:", data.expenses.length, "expenses");
        const creditExpenses = data.expenses.filter((e: any) => e.credit === true || e.credit === "true");
        console.log("Credit expenses found:", creditExpenses.length, creditExpenses);

        const frontendExpenses: Expense[] = data.expenses.map((expense: any) => {
          // Map participant IDs to emails if available
          let participantEmails: string[] = [];
          if (expense.is_group_expense && expense.participant_user_ids && expense.participant_emails) {
            // Use emails from backend if available
            participantEmails = expense.participant_user_ids
              .map((id: string) => expense.participant_emails[id] || id)
              .filter(Boolean);
          } else if (expense.is_group_expense && expense.participant_user_ids) {
            // Fallback: try to map using memberInfos
            participantEmails = expense.participant_user_ids
              .map((id: string) => memberInfos.find(mi => mi.user_id === id)?.email || id)
              .filter(Boolean);
          }
          
          return {
            id: expense.id,
            amount: expense.amount_dollars,
            category: expense.category,
            description: expense.description || "",
            date: expense.created_at.split("T")[0],
            type: expense.is_group_expense ? "group" : "personal",
            groupId: expense.group_id,
            participants: participantEmails.length > 0 ? participantEmails : expense.participant_user_ids || [],
            credit: expense.credit === true || expense.credit === "true", // Include credit field from backend, handle string/boolean
          };
        });
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
                  credit: updated.credit || false, // Include credit field from backend
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
          // Group expense specific fields
          is_group_expense: expenseType === "group",
          group_id: expenseType === "group" ? selectedGroup : undefined,
          participant_user_ids: expenseType === "group" ? participants : [],
        };

        const response = await api.post("expenses/", expenseData);
        const createdExpense = await response.json();

        // Map participant IDs to emails for display
        const participantEmails = expenseType === "group" && participants.length > 0
          ? participants.map(id => memberInfos.find(mi => mi.user_id === id)?.email || id)
          : [];
        
        const newExpense: Expense = {
          id: createdExpense.id,
          amount: createdExpense.amount_dollars,
          category: createdExpense.category,
          description: createdExpense.description || "",
          date: expenseDate,
          type: expenseType,
          groupId: selectedGroup || undefined,
          participants: expenseType === "group" ? participantEmails : [],
          credit: createdExpense.credit || false, // Include credit field from backend
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

  // Calculate total expenses: exclude Paycheck category
  const totalExpenses = expenses
    .filter((expense) => expense.category !== "Paycheck")
    .reduce((sum, expense) => {
      const isCredit = expense.credit === true;
      if (isCredit) {
        return sum - expense.amount; // Subtract credit expenses (income/revenue)
      }
      return sum + expense.amount; // Add regular expenses
    }, 0);
  
  const monthlyExpenses = expenses
    .filter((expense) => {
      // Exclude Paycheck category
      if (expense.category === "Paycheck") return false;
      const expenseDate = new Date(expense.date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => {
      const isCredit = expense.credit === true;
      if (isCredit) {
        return sum - expense.amount; // Subtract credit expenses (income/revenue)
      }
      return sum + expense.amount; // Add regular expenses
    }, 0);

  const currentGroupMembers = groups.find((g) => g.id === selectedGroup)?.members || [];
  // All groups returned from API are the user's groups
  const userGroups = groups;

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
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Add Expense
        </button>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <span className="text-2xl">💸</span>
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Net Expenses</p>
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
            <p className="text-sm text-gray-600 dark:text-gray-300">This Month (Net)</p>
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

    {/* ADD / EDIT EXPENSE POPUP */}
    {showAddForm && (
      <div
        className={`fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 transition-opacity ${
          showAddForm ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 relative">
          <button
            onClick={() => {
              setShowAddForm(false);
              setIsEditing(false);
              setEditingExpenseId(null);
            }}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            ✖
          </button>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {isEditing ? "Edit Expense" : "Add New Expense"}
          </h3>

          {/* FORM */}
          <form onSubmit={handleAddExpense} className="space-y-4">
            {/* First Line: Amount, Category, Date */}
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
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
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

            {/* Line 3: Expense Type + Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expense Type
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="personal"
                      checked={expenseType === "personal"}
                      onChange={(e) =>
                        setExpenseType(e.target.value as "personal" | "group")
                      }
                      className="mr-2"
                    />
                    Personal
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="group"
                      checked={expenseType === "group"}
                      onChange={(e) =>
                        setExpenseType(e.target.value as "personal" | "group")
                      }
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
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Participants */}
            {expenseType === "group" && selectedGroup && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Participants
                </label>
                <button
                  type="button"
                  onClick={() => setIsParticipantDropdownOpen(!isParticipantDropdownOpen)}
                  className="w-full flex justify-between items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-left"
                >
                  <span className="truncate">
                    {participants.length > 0
                      ? participants
                          .map(id => memberInfos.find(mi => mi.user_id === id)?.email || id)
                          .join(", ")
                      : "Select participants"}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      isParticipantDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
                {isParticipantDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                    <ul className="max-h-60 overflow-auto">
                      {currentGroupMembers.map((member) => (
                        <li
                          key={member}
                          onClick={() => handleParticipantToggle(member)}
                          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <span>{memberInfos.find(mi => mi.user_id === member)?.email || member}</span>
                          {participants.includes(member) && (
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
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
      </div>
    )}

    {/* EXPENSE LIST */}
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
            const isCredit = expense.credit === true;
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
                      {expense.credit && " • Income"}
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
                  {expense.category !== "Settlement" && (
                    <>
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
                    </>
                  )}
                  <p className={`font-bold ${expense.credit ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {expense.credit ? '+' : ''}${expense.amount.toFixed(2)}
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
