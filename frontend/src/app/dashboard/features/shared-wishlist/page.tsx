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
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // UI State
  const [newItem, setNewItem] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedList, setSelectedList] = useState("personal");

  // selection (global), used by card actions which filter by card scope
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // modals
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // move-to-expense form state (shared modal)
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [expenseType, setExpenseType] = useState<"personal" | "group">("personal");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [isParticipantDropdownOpen, setIsParticipantDropdownOpen] = useState(false);

  // Which items are being moved (set when opening move modal from a card)
  const [moveTargetIds, setMoveTargetIds] = useState<string[]>([]);

  // collapse state per card (key = list id). default: personal true, others false
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({ personal: true });

  const categories = [
    { id: "Food", name: "Food", icon: "🍽️" },
    { id: "Transportation", name: "Transportation", icon: "🚗" },
    { id: "Recreation", name: "Recreation", icon: "🎬" },
    { id: "Housing", name: "Housing", icon: "🏠" },
    { id: "Utilities", name: "Utilities", icon: "⚡" },
    { id: "Personal Care", name: "Personal Care", icon: "🧴" },
    { id: "Saving", name: "Saving", icon: "💰" },
    { id: "Debts", name: "Debts", icon: "💳" },
    { id: "Clothing", name: "Clothing", icon: "👕" },
    { id: "Paycheck", name: "Paycheck", icon: "💵" },
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

  // Load all wishlist items from API (personal and group items)
  const loadAllWishlistItems = async () => {
    try {
      const token = api.getToken();
      if (!token) {
        // If not logged in, fall back to localStorage for demo purposes
        if (typeof window !== "undefined") {
          try {
            const localItems = JSON.parse(localStorage.getItem("wishlist") || "[]");
            setWishlist(localItems);
          } catch {
            setWishlist([]);
          }
        }
        return;
      }

      // Load personal items
      const personalResponse = await api.get("shared-wishlist/personal");
      const personalData = await personalResponse.json();
      
      // Convert personal items to frontend format
      const personalItems: WishlistItem[] = personalData.items.map((item: any) => ({
        id: item.item_id,
        name: item.item,
        notes: item.notes || "",
        list: "personal", // Personal items have group_id as null
        purchased: !!item.purchased,
      }));

      // Load group items for each group the user is in
      const groupItems: WishlistItem[] = [];
      for (const group of groups) {
        try {
          const groupResponse = await api.get(`shared-wishlist/group/${group.group_id}`);
          const groupData = await groupResponse.json();
          
          // Convert group items to frontend format
          const itemsForGroup: WishlistItem[] = groupData.items.map((item: any) => ({
            id: item.item_id,
            name: item.item,
            notes: item.notes || "",
            list: group.group_id, // Group items have group_id
            purchased: !!item.purchased,
          }));
          
          groupItems.push(...itemsForGroup);
        } catch (err) {
          console.error(`Failed to load items for group ${group.group_id}:`, err);
          // Continue loading other groups even if one fails
        }
      }

      // Combine all items
      setWishlist([...personalItems, ...groupItems]);
    } catch (err) {
      console.error("Failed to load wishlist items:", err);
      // Fall back to localStorage on error
      if (typeof window !== "undefined") {
        try {
          const localItems = JSON.parse(localStorage.getItem("wishlist") || "[]");
          setWishlist(localItems);
        } catch {
          setWishlist([]);
        }
      }
    }
  };

  // Persist wishlist to localStorage whenever it changes (as fallback for non-logged-in users)
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    // Also ensure openCards includes all lists (when wishlist changes)
    const lists = Array.from(new Set(wishlist.map((w) => w.list).concat(["personal"])));
    setOpenCards((prev) => {
      const next = { ...prev };
      for (const l of lists) {
        if (!(l in next)) {
          next[l] = l === "personal"; // default personal open, others closed
        }
      }
      // remove keys that no longer exist (optional)
      Object.keys(next).forEach((k) => {
        if (!lists.includes(k)) {
          // keep the key if it's 'personal' or present in groups (we'll add groups below)
          // We'll leave removed keys; harmless
        }
      });
      return next;
    });
  }, [wishlist]);

  // Initialize groups and wishlist on mount
  useEffect(() => {
    loadUserGroups();
  }, []);

  // Load wishlist items after groups are loaded
  useEffect(() => {
    if (groups.length > 0) {
      loadAllWishlistItems();
    }
  }, [groups]);

  // Also ensure openCards includes groups when groups load
  useEffect(() => {
    if (groups.length === 0) return;
    setOpenCards((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (!(g.group_id in next)) next[g.group_id] = false; // groups collapsed by default
      }
      if (!("personal" in next)) next.personal = true;
      return next;
    });
  }, [groups]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem) return;

    try {
      if (selectedList === "personal") {
        // Call backend to create a personal wishlist item
        const payload = {
          item_id: crypto.randomUUID(),
          item: newItem,
          notes: notes || undefined,
        };
        const resp = await api.post("shared-wishlist/personal", payload);
        const created = await resp.json();
        
        // Refresh the wishlist from API to get the latest data
        await loadAllWishlistItems();
      } else {
        // Call backend to create a group wishlist item
        const selectedGroupObj = groups.find(g => g.group_id === selectedList);
        if (!selectedGroupObj) {
          alert("Selected group not found.");
          return;
        }
        
        const payload = {
          item_id: crypto.randomUUID(),
          item: newItem,
          group_id: selectedList, // Use the group_id
          notes: notes || undefined,
        };
        const resp = await api.post("shared-wishlist/group", payload);
        const created = await resp.json();
        
        // Refresh the wishlist from API to get the latest data
        await loadAllWishlistItems();
      }
    } catch (err) {
      console.error("Failed to add wishlist item:", err);
      alert("Failed to add item. Please try again.");
      return;
    } finally {
      setNewItem("");
      setNotes("");
      setSelectedList("personal");
      setShowAddModal(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Helpers to get grouped items
  const grouped = (() => {
    const map = new Map<string, WishlistItem[]>();
    wishlist.forEach((item) => {
      const key = item.list || "personal";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    // Ensure personal exists even if empty
    if (!map.has("personal")) map.set("personal", []);
    return map;
  })();

  const getGroupName = (listId: string) => {
    if (listId === "personal") return "Personal";
    const g = groups.find((gg) => gg.group_id === listId);
    return g ? g.group_name : "Unknown Group";
  };

  // Per-card actions (operate only on selected items within that card)
  const cardSelectedIds = (listId: string) => selectedIds.filter((id) => grouped.get(listId)?.some((i) => i.id === id));

  const handleCardMarkPurchased = async (listId: string) => {
    const ids = cardSelectedIds(listId);
    if (ids.length === 0) {
      alert("Please select at least one item in this list to mark as purchased.");
      return;
    }

    try {
      const token = api.getToken();
      if (!token) {
        alert("Please log in to mark items as purchased");
        return;
      }

      // Call the API to mark each selected item as purchased
      const markPromises = ids.map(async (id) => {
        const response = await api.post(`shared-wishlist/${id}/mark-purchased`);
        return response;
      });

      await Promise.all(markPromises);

      // Update local state to reflect the changes
      setWishlist((prev) => prev.map((w) => (ids.includes(w.id) ? { ...w, purchased: true } : w)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));

      alert("Successfully marked items as purchased!");
    } catch (error) {
      console.error("Error marking items as purchased:", error);
      alert("Failed to mark items as purchased. Please try again.");
    }
  };

  const handleCardDelete = async (listId: string) => {
    const ids = cardSelectedIds(listId);
    if (ids.length === 0) {
      alert("Please select at least one item in this list to delete.");
      return;
    }

    try {
      const token = api.getToken();
      if (!token) {
        alert("Please log in to delete items");
        return;
      }

      // Call the API to delete each selected item
      const deletePromises = ids.map(async (id) => {
        const response = await api.delete(`shared-wishlist/${id}`);
        return response;
      });

      await Promise.all(deletePromises);

      // Update local state to remove deleted items
      setWishlist((prev) => prev.filter((w) => !ids.includes(w.id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));

      alert("Successfully deleted items!");
    } catch (error) {
      console.error("Error deleting items:", error);
      alert("Failed to delete items. Please try again.");
    }
  };

  // Open move modal for items in this card
  const handleCardMoveToExpenses = (listId: string) => {
    const ids = cardSelectedIds(listId);
    if (ids.length === 0) {
      alert("Please select at least one item in this list to move.");
      return;
    }

    // Prefill description with item names and prefill group if group list
    const selectedItems = wishlist.filter((w) => ids.includes(w.id));
    setDescription(selectedItems.map((s) => s.name).join(", "));
    const first = selectedItems[0];
    if (first && first.list !== "personal") {
      setExpenseType("group");
      setSelectedGroup(first.list);
    } else {
      setExpenseType("personal");
      setSelectedGroup("");
    }

    setAmount("");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setParticipants([]);
    setIsParticipantDropdownOpen(false);

    setMoveTargetIds(ids); // store which items are being moved
    setShowMoveForm(true);
  };

  const handleParticipantToggle = (member: string) => {
    setParticipants((prev) => (prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]));
  };


  const confirmMoveToExpenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) {
      alert("Please fill amount, category and date.");
      return;
    }

    try {
      const token = api.getToken();
      if (!token) {
        alert("Please log in to move items to expenses");
        return;
      }

      // Create expenses for each selected wishlist item
      const expensePromises = moveTargetIds.map(async (id) => {
        const item = wishlist.find((w) => w.id === id)!;
        
        const expenseData = {
          amount_dollars: parseFloat(amount),
          credit: false,
          category,
          description: description || item.name + (item.notes ? ` - ${item.notes}` : ""),
          created_at: date,
          // Group expense specific fields
          is_group_expense: expenseType === "group",
          group_id: expenseType === "group" ? selectedGroup : undefined,
          participant_user_ids: expenseType === "group" ? participants : [],
        };

        const response = await api.post("expenses/", expenseData);
        const createdExpense = await response.json();

        return {
          id: createdExpense.id,
          amount: createdExpense.amount_dollars,
          category: createdExpense.category,
          description: createdExpense.description || "",
          date,
          type: expenseType,
          groupId: expenseType === "group" ? selectedGroup : undefined,
          participants: expenseType === "group" ? participants : [],
        };
      });

      // Wait for all expenses to be created
      await Promise.all(expensePromises);

      // Mark wishlist items as purchased in the database
      const markPurchasedPromises = moveTargetIds.map(async (id) => {
        const response = await api.post(`shared-wishlist/${id}/mark-purchased`);
        return response;
      });

      await Promise.all(markPurchasedPromises);

      // Update local state to reflect the changes
      setWishlist((prev) => prev.map((w) => (moveTargetIds.includes(w.id) ? { ...w, purchased: true } : w)));

      // reset state
      setSelectedIds((prev) => prev.filter((id) => !moveTargetIds.includes(id)));
      setMoveTargetIds([]);
      setAmount("");
      setCategory("");
      setDate("");
      setDescription("");
      setExpenseType("personal");
      setSelectedGroup("");
      setParticipants([]);
      setIsParticipantDropdownOpen(false);
      setShowMoveForm(false);

      alert("Successfully moved items to expenses!");
    } catch (error) {
      console.error("Error moving items to expenses:", error);
      alert("Failed to move items to expenses. Please try again.");
    }
  };

  // Toggle open/closed for a card
  const toggleCardOpen = (listId: string) => {
    setOpenCards((prev) => ({ ...prev, [listId]: !prev[listId] }));
  };

  // compute current group members from selectedGroup
  const currentGroupMembers = groups.find((g) => g.group_id === selectedGroup)?.members || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Wishlist</h2>
          <p className="text-gray-600 dark:text-gray-300">Keep track of things you and your groups want</p>
        </div>

        <div className="flex space-x-3">
          <Link href="/groups" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Manage Groups
          </Link>

          <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            ➕ Add Item
          </button>
        </div>
      </div>

      {/* Cards: iterate grouped entries */}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([listId, items]) => {
          const isOpen = !!openCards[listId];
          const groupName = getGroupName(listId);
          const count = items.length;
          return (
            <div key={listId} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCardOpen(listId)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{isOpen ? "▼" : "▶"}</div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{groupName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{listId === "personal" ? "Personal wishlist" : `Group`}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{count} item{count !== 1 ? "s" : ""}</div>
              </button>

              <div
                className={`px-5 pt-0 pb-5 transition-all duration-200 ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
              >
                <div className="space-y-3 mt-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No items yet</div>
                  ) : (
                    items.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition
                            ${isSelected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900" : item.purchased ? "bg-gray-100 dark:bg-gray-700 opacity-60" : "bg-gray-50 dark:bg-gray-700"}`}
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            {item.notes && <p className="text-sm text-gray-600 dark:text-gray-300">{item.notes}</p>}
                          </div>
                          {item.purchased && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Purchased</span>}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Per-card action buttons */}
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => handleCardMarkPurchased(listId)}
                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    ✅ Mark as Purchased
                  </button>

                  <button
                    onClick={() => handleCardDelete(listId)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ Delete Selected
                  </button>

                  <button
                    onClick={() => handleCardMoveToExpenses(listId)}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📊 Move to Expenses
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/10 dark:bg-black/20 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
              ✖
            </button>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Item</h3>

            <form
              onSubmit={(e) => {
                handleAddItem(e);
                setShowAddModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item Name</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wishlist</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
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
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">Add Item</button>
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
                setMoveTargetIds([]);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              ✖
            </button>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Move to Expenses</h3>

            <form onSubmit={confirmMoveToExpenses} className="space-y-4">
              {/* Amount, Category, Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount ($)</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2" required>
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                  <input type="date" value={date || new Date().toISOString().split("T")[0]} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2" required />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2" placeholder="What was this expense for?" required />
              </div>

              {/* Expense Type + Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expense Type</label>
                  <div className="flex items-center h-full space-x-6">
                    <label className="flex items-center">
                      <input type="radio" value="personal" checked={expenseType === "personal"} onChange={(e) => setExpenseType(e.target.value as "personal" | "group")} className="mr-2" /> Personal
                    </label>
                    <label className="flex items-center">
                      <input type="radio" value="group" checked={expenseType === "group"} onChange={(e) => setExpenseType(e.target.value as "personal" | "group")} className="mr-2" /> Group
                    </label>
                  </div>
                </div>

                {expenseType === "group" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Group</label>
                    <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setParticipants([]); }} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2">
                      <option value="">Select group</option>
                      {groups.map((g) => (
                        <option key={g.group_id} value={g.group_id}>
                          {g.group_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Participants */}
              {expenseType === "group" && selectedGroup && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participants</label>
                  <button type="button" onClick={() => setIsParticipantDropdownOpen((s) => !s)} className="w-full flex justify-between items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-left">
                    <span className="truncate">{participants.length > 0 ? participants.join(", ") : "Select participants"}</span>
                    <svg className={`w-5 h-5 transition-transform ${isParticipantDropdownOpen ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {isParticipantDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                      <ul className="max-h-60 overflow-auto">
                        {currentGroupMembers.length === 0 ? (
                          <li className="px-4 py-2 text-sm text-gray-500">No members found</li>
                        ) : (
                          currentGroupMembers.map((member) => (
                            <li key={member} onClick={() => handleParticipantToggle(member)} className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                              <span>{member}</span>
                              {participants.includes(member) && <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}


              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setShowMoveForm(false); setParticipants([]); setIsParticipantDropdownOpen(false); setMoveTargetIds([]); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Cancel</button>
                <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">Confirm & Move</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
