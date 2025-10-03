"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/utils/api";

interface WishlistItem {
  id: string;
  name: string;
  notes: string;
  list: string; // "personal" or group id
  purchased: boolean;
}

interface Group {
  group_id: string;
  group_name: string;
  group_code: string;
  created_by: string;
  created_at: string;
  is_admin: boolean;
  joined_at: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "personal" | "group";
  groupId?: string;
}

export default function SharedWishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("wishlist") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [newItem, setNewItem] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedList, setSelectedList] = useState("personal");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMoveForm, setShowMoveForm] = useState(false);

  // expense form
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  const categories = [
    { id: "food", name: "Food & Dining", icon: "🍽️" },
    { id: "transport", name: "Transportation", icon: "🚗" },
    { id: "entertainment", name: "Entertainment", icon: "🎬" },
    { id: "supplies", name: "School Supplies", icon: "📚" },
    { id: "utilities", name: "Utilities", icon: "⚡" },
    { id: "other", name: "Other", icon: "📦" },
  ];

  // Load user groups from API
  const loadUserGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await api.get("groups/my-groups");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Persist wishlist to localStorage
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Load groups on component mount
  useEffect(() => {
    loadUserGroups();
  }, []);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem) return;
    const item: WishlistItem = {
      id: crypto.randomUUID(),
      name: newItem,
      notes,
      list: selectedList,
      purchased: false,
    };
    setWishlist([item, ...wishlist]);
    setNewItem("");
    setNotes("");
    setSelectedList("personal");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMoveToExpenses = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one item to move.");
      return;
    }
    setDate(new Date().toISOString().split("T")[0]);
    setShowMoveForm(true);
  };

  const confirmMoveToExpenses = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;

    const expenses: Expense[] = JSON.parse(localStorage.getItem("expenses") || "[]");
    const newExpenses: Expense[] = selectedIds.map((id) => {
      const item = wishlist.find((w) => w.id === id)!;
      return {
        id: crypto.randomUUID(),
        amount: parseFloat(amount),
        category,
        description: item.name + (item.notes ? ` - ${item.notes}` : ""),
        date,
        type: item.list === "personal" ? "personal" : "group",
        groupId: item.list !== "personal" ? item.list : undefined,
      };
    });

    localStorage.setItem("expenses", JSON.stringify([...newExpenses, ...expenses]));

    // mark purchased
    setWishlist((prev) =>
      prev.map((w) =>
        selectedIds.includes(w.id) ? { ...w, purchased: true } : w
      )
    );
    setSelectedIds([]);
    setAmount("");
    setCategory("");
    setShowMoveForm(false);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one item to delete.");
      return;
    }
    setWishlist((prev) => prev.filter((w) => !selectedIds.includes(w.id)));
    setSelectedIds([]);
  };

  const handleMarkAsPurchased = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one item to mark as purchased.");
      return;
    }
    setWishlist((prev) =>
      prev.map((w) =>
        selectedIds.includes(w.id) ? { ...w, purchased: true } : w
      )
    );
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shared Wishlist
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Keep track of things you and your groups want
          </p>
        </div>
        <Link
          href="/dashboard/features/groups"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Manage Groups
        </Link>
      </div>

      {/* Add Item Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Add Item
        </h3>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Item Name
            </label>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wishlist
              </label>
              <select
                value={selectedList}
                onChange={(e) => setSelectedList(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingGroups}
              >
                <option value="personal">Personal</option>
                {groups.map((group) => (
                  <option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>

      {/* Move to Expenses Form */}
      {showMoveForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Move to Expenses
          </h3>
          <form onSubmit={confirmMoveToExpenses} className="space-y-4">
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
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowMoveForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm & Move
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Wishlist Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Wishlist Items
        </h3>
        {wishlist.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items yet</div>
        ) : (
          <div className="space-y-3">
            {wishlist.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition 
                    ${
                      isSelected
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900"
                        : item.purchased
                        ? "bg-gray-100 dark:bg-gray-700 opacity-60"
                        : "bg-gray-50 dark:bg-gray-700"
                    }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  {item.purchased && (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Purchased
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Always visible actions */}
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={handleMarkAsPurchased}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            ✅ Mark as Purchased
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Delete Selected
          </button>
          <button
            onClick={handleMoveToExpenses}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            📊 Move to Expenses
          </button>
        </div>
      </div>
    </div>
  );
}
