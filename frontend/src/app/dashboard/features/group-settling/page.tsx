"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

interface GroupSettlement {
  group_id: string;
  group_name: string;
  group_code: string;
  balance: number; // Positive means you're owed money, negative means you owe money
  total_transactions: number;
  last_activity: string;
}

interface Transaction {
  transaction_id: string;
  group_id: string;
  payer_id: string;
  payer_name: string;
  amount: number;
  description: string;
  created_at: string;
  participants: {
    user_id: string;
    user_name: string;
    amount_owed: number;
  }[];
}

interface BackendGroupedTransaction {
  group_id: string;
  user_owed: string;
  user_owing_list: string[];
  amount_per_person: number;
  total_amount: number;
  participant_count: number;
  created_at: string;
  transaction_ids: number[];
  notes?: string;
}

interface BackendResponse {
  transactions: BackendGroupedTransaction[];
  transactions_by_group: Record<string, BackendGroupedTransaction[]>;
  user_balance: number;
  total_owed: number;
  total_owing: number;
  groups: Array<{
    group_id: string;
    group_information?: {
      group_name: string;
      group_code: string;
      created_by: string;
    };
  }>;
  user_emails: Record<string, string>; // Maps user_id to email
}

// Helper function to parse the JWT and extract the user ID
function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch (error) {
    console.error("Failed to parse token:", error);
    return null;
  }
}

export default function GroupSettlingPage() {
  const router = useRouter();
  const [groupSettlements, setGroupSettlements] = useState<GroupSettlement[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupSettlement | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactionsByGroup, setTransactionsByGroup] = useState<Record<string, BackendGroupedTransaction[]>>({});
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  // Helper function to get user display name
  const getUserDisplayName = (user_id: string, currentUserId: string, emails: Record<string, string>): string => {
    if (user_id === currentUserId) {
      return "You";
    }
    // Return email if available, otherwise fallback to truncated user ID
    return emails[user_id] || `User ${user_id.slice(0, 8)}`;
  };

  // Transform backend transaction to frontend format
  const transformTransaction = (
    backendTrans: BackendGroupedTransaction,
    userId: string,
    emails: Record<string, string>
  ): Transaction => {
    const payerId = backendTrans.user_owed;
    
    // Create participants list
    const participants = [
      {
        user_id: payerId,
        user_name: getUserDisplayName(payerId, userId, emails),
        amount_owed: 0,
      },
      ...backendTrans.user_owing_list.map((owingId) => ({
        user_id: owingId,
        user_name: getUserDisplayName(owingId, userId, emails),
        amount_owed: backendTrans.amount_per_person,
      })),
    ];

    return {
      transaction_id: backendTrans.transaction_ids.join(","),
      group_id: backendTrans.group_id,
      payer_id: payerId,
      payer_name: getUserDisplayName(payerId, userId, emails),
      amount: backendTrans.total_amount,
      description: backendTrans.notes || `Split expense - ${backendTrans.participant_count} people`,
      created_at: backendTrans.created_at,
      participants,
    };
  };

  // Calculate balance for a specific group
  const calculateGroupBalance = useCallback((
    groupId: string,
    userId: string,
    backendTransactions: BackendGroupedTransaction[]
  ): number => {
    let balance = 0;
    for (const trans of backendTransactions) {
      if (trans.group_id === groupId) {
        if (trans.user_owed === userId) {
          // You're owed money from others
          balance += trans.amount_per_person * trans.user_owing_list.length;
        }
        if (trans.user_owing_list.includes(userId)) {
          // You owe money to the payer
          balance -= trans.amount_per_person;
        }
      }
    }
    return balance;
  }, []);

  // Fetch transactions and groups from backend
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = api.getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const id = getUserIdFromToken(token);
      setUserId(id);

      const response = await api.get("transactions/settlements/me");
      const data: BackendResponse = await response.json();

      console.log("API Response:", data);
      console.log("User emails:", data.user_emails);

      // Store transactions by group and user emails
      setTransactionsByGroup(data.transactions_by_group || {});
      setUserEmails(data.user_emails || {});

      // Transform groups to GroupSettlement format
      const groupSettlementsData: GroupSettlement[] = (data.groups || []).map((group) => {
        const groupTrans = data.transactions_by_group[group.group_id] || [];
        const balance = calculateGroupBalance(group.group_id, id || "", data.transactions);
        const lastActivity = groupTrans.length > 0 
          ? groupTrans[0].created_at 
          : new Date().toISOString();

        return {
          group_id: group.group_id,
          group_name: group.group_information?.group_name || "Unnamed Group",
          group_code: group.group_information?.group_code || "N/A",
          balance: balance,
          total_transactions: groupTrans.length,
          last_activity: lastActivity,
        };
      });

      setGroupSettlements(groupSettlementsData);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router, calculateGroupBalance]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleGroupClick = (group: GroupSettlement) => {
    setSelectedGroup(group);
    // Get transactions for the selected group and transform them
    const groupBackendTrans = transactionsByGroup[group.group_id] || [];
    console.log("Group transactions:", groupBackendTrans);
    console.log("User emails for transformation:", userEmails);
    const transformedTransactions = groupBackendTrans.map((trans) =>
      transformTransaction(trans, userId || "", userEmails)
    );
    console.log("Transformed transactions:", transformedTransactions);
    setTransactions(transformedTransactions);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setTransactions([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = async () => {
    try {
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
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please log in to access group settling.</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">CampusFin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Group Settling
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track and settle expenses with your groups
          </p>
          {error && (
            <div className="mt-4 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
              <button
                onClick={fetchTransactions}
                className="ml-4 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {!selectedGroup ? (
          /* Group Cards View */
          <div className="space-y-4">
            {groupSettlements.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Groups Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You haven't joined any groups yet. Create or join a group to start tracking shared expenses.
                </p>
                <Link
                  href="/dashboard/features/groups"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Manage Groups
                </Link>
              </div>
            ) : (
              groupSettlements.map((group) => (
                <div
                  key={group.group_id}
                  onClick={() => handleGroupClick(group)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-200 border-l-4 border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {group.group_name}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {group.group_code}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <span>{group.total_transactions} transactions</span>
                        <span>•</span>
                        <span>Last activity: {formatDate(group.last_activity)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {group.balance > 0 ? (
                        <div className="text-green-600 dark:text-green-400">
                          <div className="text-sm font-medium">You're owed</div>
                          <div className="text-2xl font-bold">+{formatCurrency(group.balance)}</div>
                        </div>
                      ) : group.balance < 0 ? (
                        <div className="text-red-600 dark:text-red-400">
                          <div className="text-sm font-medium">You owe</div>
                          <div className="text-2xl font-bold">-{formatCurrency(group.balance)}</div>
                        </div>
                      ) : (
                        <div className="text-gray-600 dark:text-gray-400">
                          <div className="text-sm font-medium">Settled up</div>
                          <div className="text-2xl font-bold">$0.00</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Group Detail View */
          <div className="space-y-6">
            {/* Group Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <button
                    onClick={handleBackToGroups}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2"
                  >
                    ← Back to Groups
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedGroup.group_name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Group Code: {selectedGroup.group_code}
                  </p>
                </div>
                <div className="text-right">
                  {selectedGroup.balance > 0 ? (
                    <div className="text-green-600 dark:text-green-400">
                      <div className="text-sm font-medium">You're owed</div>
                      <div className="text-3xl font-bold">+{formatCurrency(selectedGroup.balance)}</div>
                    </div>
                  ) : selectedGroup.balance < 0 ? (
                    <div className="text-red-600 dark:text-red-400">
                      <div className="text-sm font-medium">You owe</div>
                      <div className="text-3xl font-bold">-{formatCurrency(selectedGroup.balance)}</div>
                    </div>
                  ) : (
                    <div className="text-gray-600 dark:text-gray-400">
                      <div className="text-sm font-medium">Settled up</div>
                      <div className="text-3xl font-bold">$0.00</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Transactions
              </h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-600 dark:text-gray-300">
                    No transactions yet in this group.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.transaction_id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {transaction.description}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Paid by {transaction.payer_name} • {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Split among:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {transaction.participants.map((participant) => (
                            <div
                              key={participant.user_id}
                              className={`text-sm p-2 rounded ${
                                participant.amount_owed === 0
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="font-medium">{participant.user_name}</div>
                              <div>
                                {participant.amount_owed === 0
                                  ? 'Paid'
                                  : `Owes ${formatCurrency(participant.amount_owed)}`
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Add Transaction
              </button>
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                Settle Up
              </button>
              <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                Export Report
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
