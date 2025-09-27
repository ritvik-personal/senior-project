/**
 * Shared Wishlist Page Component
 * 
 * This component handles shared wishlist functionality for roommates and groups.
 * Features:
 * - Create and manage shared wishlists
 * - Add items with descriptions, prices, and priorities
 * - Mark items as purchased and move to expense tracking
 * - Invite roommates/groups to collaborate
 * - Track group spending and contributions
 * - Seamless integration with expense tracking
 * 
 * Use cases:
 * - Grocery shopping lists
 * - Dorm supplies
 * - Group purchases
 * - Event planning
 */

"use client";

import { useState, useEffect } from "react";

interface WishlistItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priority: 'low' | 'medium' | 'high';
  addedBy: string;
  addedDate: string;
  status: 'pending' | 'purchased' | 'cancelled';
  purchasedBy?: string;
  purchasedDate?: string;
  category: string;
}

interface Wishlist {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  members: string[];
  items: WishlistItem[];
  totalValue: number;
  purchasedValue: number;
}

interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
}

export default function SharedWishlistPage() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateWishlist, setShowCreateWishlist] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedWishlist, setSelectedWishlist] = useState<string>('');
  
  // Form states
  const [wishlistName, setWishlistName] = useState('');
  const [wishlistDescription, setWishlistDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemPriority, setItemPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [itemCategory, setItemCategory] = useState('');

  const categories = [
    'Groceries', 'Dorm Supplies', 'Electronics', 'Clothing', 'Books', 'Entertainment', 'Other'
  ];

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴'
  };

  // Sample data
  useEffect(() => {
    const sampleGroups: Group[] = [
      { id: '1', name: 'Room 201', members: ['Alice', 'Bob', 'Charlie'], createdBy: 'Alice' },
      { id: '2', name: 'Study Group', members: ['Alice', 'David', 'Eve'], createdBy: 'David' }
    ];

    const sampleWishlists: Wishlist[] = [
      {
        id: '1',
        name: 'Weekly Groceries',
        description: 'Essential groceries for the week',
        createdBy: 'Alice',
        createdAt: new Date().toISOString(),
        members: ['Alice', 'Bob', 'Charlie'],
        totalValue: 85.50,
        purchasedValue: 45.25,
        items: [
          {
            id: '1',
            name: 'Milk',
            description: '2% milk, 1 gallon',
            price: 3.99,
            priority: 'high',
            addedBy: 'Alice',
            addedDate: new Date().toISOString(),
            status: 'purchased',
            purchasedBy: 'Bob',
            purchasedDate: new Date().toISOString(),
            category: 'Groceries'
          },
          {
            id: '2',
            name: 'Bread',
            description: 'Whole wheat bread',
            price: 2.99,
            priority: 'medium',
            addedBy: 'Charlie',
            addedDate: new Date().toISOString(),
            status: 'purchased',
            purchasedBy: 'Alice',
            purchasedDate: new Date().toISOString(),
            category: 'Groceries'
          },
          {
            id: '3',
            name: 'Eggs',
            description: 'Dozen large eggs',
            price: 4.99,
            priority: 'high',
            addedBy: 'Bob',
            addedDate: new Date().toISOString(),
            status: 'pending',
            category: 'Groceries'
          }
        ]
      }
    ];

    setGroups(sampleGroups);
    setWishlists(sampleWishlists);
  }, []);

  const handleCreateWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistName || !selectedGroup) return;

    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return;

    const newWishlist: Wishlist = {
      id: Date.now().toString(),
      name: wishlistName,
      description: wishlistDescription,
      createdBy: 'Current User', // In real app, get from auth
      createdAt: new Date().toISOString(),
      members: group.members,
      totalValue: 0,
      purchasedValue: 0,
      items: []
    };

    setWishlists([newWishlist, ...wishlists]);
    setWishlistName('');
    setWishlistDescription('');
    setSelectedGroup('');
    setShowCreateWishlist(false);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would handle group creation
    setShowCreateGroup(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !selectedWishlist) return;

    const wishlist = wishlists.find(w => w.id === selectedWishlist);
    if (!wishlist) return;

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: itemName,
      description: itemDescription,
      price: parseFloat(itemPrice),
      priority: itemPriority,
      addedBy: 'Current User', // In real app, get from auth
      addedDate: new Date().toISOString(),
      status: 'pending',
      category: itemCategory
    };

    const updatedWishlist = {
      ...wishlist,
      items: [...wishlist.items, newItem],
      totalValue: wishlist.totalValue + newItem.price
    };

    setWishlists(wishlists.map(w => w.id === selectedWishlist ? updatedWishlist : w));
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemPriority('medium');
    setItemCategory('');
    setShowAddItem(false);
  };

  const handleMarkPurchased = (wishlistId: string, itemId: string) => {
    const wishlist = wishlists.find(w => w.id === wishlistId);
    if (!wishlist) return;

    const updatedItems = wishlist.items.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            status: 'purchased' as const,
            purchasedBy: 'Current User',
            purchasedDate: new Date().toISOString()
          }
        : item
    );

    const purchasedValue = updatedItems
      .filter(item => item.status === 'purchased')
      .reduce((sum, item) => sum + item.price, 0);

    const updatedWishlist = {
      ...wishlist,
      items: updatedItems,
      purchasedValue
    };

    setWishlists(wishlists.map(w => w.id === wishlistId ? updatedWishlist : w));
  };

  const getProgressPercentage = (wishlist: Wishlist) => {
    if (wishlist.totalValue === 0) return 0;
    return Math.round((wishlist.purchasedValue / wishlist.totalValue) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Wishlist</h2>
          <p className="text-gray-600 dark:text-gray-300">Plan purchases collectively with roommates and groups</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            👥 Create Group
          </button>
          <button
            onClick={() => setShowCreateWishlist(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Create Wishlist
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Active Wishlists</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{wishlists.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Items Purchased</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {wishlists.reduce((sum, w) => sum + w.items.filter(i => i.status === 'purchased').length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Groups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{groups.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${wishlists.reduce((sum, w) => sum + w.totalValue, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Wishlist Form */}
      {showCreateWishlist && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Wishlist</h3>
          <form onSubmit={handleCreateWishlist} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wishlist Name
                </label>
                <input
                  type="text"
                  value={wishlistName}
                  onChange={(e) => setWishlistName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Weekly Groceries"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a group</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.members.length} members)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={wishlistDescription}
                onChange={(e) => setWishlistDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what this wishlist is for..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateWishlist(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Wishlist
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Item Form */}
      {showAddItem && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Item to Wishlist</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Milk"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={itemPriority}
                  onChange={(e) => setItemPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2% milk, 1 gallon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wishlist
              </label>
              <select
                value={selectedWishlist}
                onChange={(e) => setSelectedWishlist(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a wishlist</option>
                {wishlists.map(wishlist => (
                  <option key={wishlist.id} value={wishlist.id}>
                    {wishlist.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
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
      )}

      {/* Wishlists */}
      <div className="space-y-6">
        {wishlists.map(wishlist => (
          <div key={wishlist.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{wishlist.name}</h3>
                <p className="text-gray-600 dark:text-gray-300">{wishlist.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created by {wishlist.createdBy} • {wishlist.members.length} members
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedWishlist(wishlist.id);
                    setShowAddItem(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  ➕ Add Item
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  📊 Move to Expenses
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getProgressPercentage(wishlist)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${getProgressPercentage(wishlist)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mt-1">
                <span>${wishlist.purchasedValue.toFixed(2)} purchased</span>
                <span>${wishlist.totalValue.toFixed(2)} total</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {wishlist.items.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-4 rounded-lg ${
                  item.status === 'purchased' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{priorityIcons[item.priority]}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>
                        {item.priority}
                      </span>
                    </div>
                    <div>
                      <p className={`font-medium ${item.status === 'purchased' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {item.description} • {item.category} • Added by {item.addedBy}
                      </p>
                      {item.status === 'purchased' && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Purchased by {item.purchasedBy} on {new Date(item.purchasedDate!).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-gray-900 dark:text-white">${item.price.toFixed(2)}</span>
                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleMarkPurchased(wishlist.id, item.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Mark Purchased
                      </button>
                    )}
                    {item.status === 'purchased' && (
                      <span className="text-green-600 dark:text-green-400 font-medium">✓ Purchased</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {wishlists.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <span className="text-6xl mb-4 block">🛒</span>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Wishlists Yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create your first shared wishlist to start planning purchases with roommates
          </p>
          <button
            onClick={() => setShowCreateWishlist(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Wishlist
          </button>
        </div>
      )}
    </div>
  );
}
