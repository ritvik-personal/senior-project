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
  members?: string[]; // optional members list (frontend expects this for participants)
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
  receiptUrl?: string;
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
  const [showAddModal, setShowAddModal] = useState(false);

  // Expense form states (for Move to Expenses modal)
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [expenseType, setExpenseType] = useState<"personal" | "group">("personal");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [isParticipantDropdownOpen, setIsParticipantDropdownOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

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
    setShowAddModal(false);
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

    // Prefill description from selected items
    const selectedItems = wishlist.filter((w) => selectedIds.includes(w.id));
    const names = selectedItems.map((s) => s.name);
    setDescription(names.join(", "));

    // Determine type & group (use first selected item as source)
    const firstItem = selectedItems[0];
    if (firstItem && firstItem.list !== "personal") {
      setExpenseType("group");
      setSelectedGroup(firstItem.list);
    } else {
      setExpenseType("personal");
      setSelectedGroup("");
    }

    setAmount("");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setParticipants([]);
    setReceiptFile(null);
    setIsParticipantDropdownOpen(false);
    setShowMoveForm(true);
  };

  const handleParticipantToggle = (member: string) => {
    setParticipants((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const confirmMoveToExpenses = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) {
      alert("Please fill amount, category and date.");
      return;
    }

    const expenses: Expense[] = JSON.parse(localStorage.getItem("expenses") || "[]");

    const newExpenses: Expense[] = selectedIds.map((id) => {
      const item = wishlist.find((w) => w.id === id)!;
      return {
        id: crypto.randomUUID(),
        amount: parseFloat(amount),
        category,
        description:
          description ||
          item.name + (item.notes ? ` - ${item.notes}` : ""),
        date,
        type: expenseType,
        groupId: expenseType === "group" ? selectedGroup || undefined : undefined,
        participants: participants.length > 0 ? participants : undefined,
        receiptUrl: receiptFile ? URL.createObjectURL(receiptFile) : undefined,
      };
    });

    localStorage.setItem("expenses", JSON.stringify([...newExpenses, ...expenses]));

    // mark wishlist items as purchased
    setWishlist((prev) =>
      prev.map((w) =>
        selectedIds.includes(w.id) ? { ...w, purchased: true } : w
      )
    );

    // reset modal state
    setSelectedIds([]);
    setAmount("");
    setCategory("");
    setDate("");
    setDescription("");
    setExpenseType("personal");
    setSelectedGroup("");
    setParticipants([]);
    setReceiptFile(null);
    setIsParticipantDropdownOpen(false);
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

  const currentGroupMembers =
    groups.find((g) => g.group_id === selectedGroup)?.members || [];

  return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shared Wishlist
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Keep track of things you and your groups want
        </p>
      </div>
      <div className="flex space-x-3">
        <Link
          href="/dashboard/features/groups"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Manage Groups
        </Link>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Add Item
        </button>
      </div>
    </div>

    {/* WISHLIST ITEMS */}
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

      {/* Actions */}
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

    {/* ADD ITEM MODAL */}
    {showAddModal && (
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/10 dark:bg-black/20 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 relative">
          <button
            onClick={() => setShowAddModal(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            ✖
          </button>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add Item
          </h3>

          <form
            onSubmit={(e) => {
              handleAddItem(e);
              setShowAddModal(false);
            }}
            className="space-y-4"
          >
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

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* MOVE TO EXPENSES MODAL */}
    {showMoveForm && (
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/10 dark:bg-black/20 z-50 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl my-10 relative">
          <button
            onClick={() => {
              setShowMoveForm(false);
              setParticipants([]);
              setIsParticipantDropdownOpen(false);
              setReceiptFile(null);
            }}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            ✖
          </button>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Move to Expenses
          </h3>

          <form onSubmit={confirmMoveToExpenses} className="space-y-4">
            {/* Amount, Category, Date */}
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
                  value={date || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                placeholder="What was this expense for?"
                required
              />
            </div>

            {/* Expense Type + Group */}
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
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                      setParticipants([]);
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  >
                    <option value="">Select group</option>
                    {groups.map((group) => (
                      <option key={group.group_id} value={group.group_id}>
                        {group.group_name}
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
                  onClick={() => setIsParticipantDropdownOpen((s) => !s)}
                  className="w-full flex justify-between items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-left"
                >
                  <span className="truncate">
                    {participants.length > 0
                      ? participants.join(", ")
                      : "Select participants"}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      isParticipantDropdownOpen ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isParticipantDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                    <ul className="max-h-60 overflow-auto">
                      {currentGroupMembers.length === 0 ? (
                        <li className="px-4 py-2 text-sm text-gray-500">
                          No members found
                        </li>
                      ) : (
                        currentGroupMembers.map((member) => (
                          <li
                            key={member}
                            onClick={() => handleParticipantToggle(member)}
                            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <span>{member}</span>
                            {participants.includes(member) && (
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Upload Receipt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Receipt
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                  id="move-receipt-upload"
                />
                <label htmlFor="move-receipt-upload" className="cursor-pointer block">
                  <span className="text-6xl mb-4 block">📷</span>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Click to upload receipt
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    (Optional) OCR will be processed by backend later
                  </p>
                  {receiptFile && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Selected: {receiptFile.name}
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowMoveForm(false);
                  setParticipants([]);
                  setIsParticipantDropdownOpen(false);
                  setReceiptFile(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Confirm & Move
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);


}
