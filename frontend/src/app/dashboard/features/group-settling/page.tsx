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
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleGroupId, setSettleGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [memberInfos, setMemberInfos] = useState<Record<string, string>>({});
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isParticipantDropdownOpen, setIsParticipantDropdownOpen] = useState(false);
  const [whoOwesWho, setWhoOwesWho] = useState<Array<{ user_id: string; name: string; net_amount: number }>>([]);

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

  // Load members for current group for Settle Up dialog
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const gid = selectedGroup?.group_id || null;
        if (!gid) return;
        const resp = await api.get(`groups/${gid}/members?exclude_self=false`);
        const data = await resp.json();
        const ids = (data || []).map((m: any) => m.user_id);
        const emails: Record<string, string> = {};
        (data || []).forEach((m: any) => {
          if (m.email) emails[m.user_id] = m.email;
        });
        setGroupMembers(ids);
        setMemberInfos(emails);
      } catch (e) {
        console.error("Failed to load group members:", e);
        setGroupMembers([]);
      }
    };

    loadMembers();
  }, [selectedGroup]);

  const handleToggleParticipant = (memberId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(memberId) ? prev.filter((m) => m !== memberId) : [...prev, memberId]
    );
  };

  // Compute who owes whom relative to current user for selected group
  useEffect(() => {
    if (!userId || !selectedGroup) {
      setWhoOwesWho([]);
      return;
    }

    const balances: Record<string, number> = {};

    for (const tx of transactions) {
      const payerId = tx.payer_id;
      const owingParticipants = tx.participants.filter(p => p.amount_owed > 0);

      if (payerId === userId) {
        // Others owe current user
        for (const p of owingParticipants) {
          balances[p.user_id] = (balances[p.user_id] || 0) + p.amount_owed;
        }
      } else {
        // If current user owes the payer
        const me = owingParticipants.find(p => p.user_id === userId);
        if (me) {
          balances[payerId] = (balances[payerId] || 0) - me.amount_owed;
        }
      }
    }

    const rows = Object.entries(balances)
      .filter(([, amount]) => Math.abs(amount) > 0.0001)
      .map(([uid, amount]) => ({
        user_id: uid,
        name: getUserDisplayName(uid, userId, userEmails),
        net_amount: amount,
      }))
      // Sort: people you owe first (negative), then owed to you (positive), largest magnitude first
      .sort((a, b) => {
        if (a.net_amount === b.net_amount) return Math.abs(b.net_amount) - Math.abs(a.net_amount);
        return a.net_amount - b.net_amount;
      });

    setWhoOwesWho(rows);
  }, [transactions, userId, selectedGroup, userEmails]);

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

  // removed inline logout; handled globally in TopNav

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
    <div>
      <main>
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Group Settling
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Track and settle expenses with your groups
              </p>
            </div>
          </div>
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
                  href="/groups"
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

            {/* Who Owes Whom Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Who owes whom</h3>
                <button
                  onClick={() => {
                    setSettleGroupId(selectedGroup?.group_id || null);
                    setSelectedParticipants([]);
                    setSettleAmount("");
                    setIsSettleDialogOpen(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Settle Up
                </button>
              </div>
              {whoOwesWho.length === 0 ? (
                <div className="text-gray-600 dark:text-gray-300">No outstanding balances within this group.</div>
              ) : (
                <div className="space-y-2">
                  {whoOwesWho.map((row) => (
                    <div
                      key={row.user_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-200">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-gray-900 dark:text-white font-medium">{row.name}</div>
                      </div>
                      {row.net_amount > 0 ? (
                        <span className="text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-md text-sm font-semibold">
                          owes you ${Math.abs(row.net_amount).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-md text-sm font-semibold">
                          you owe ${Math.abs(row.net_amount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Transactions
                </h3>
                <button
                  onClick={() => {
                    router.push(`/expenses?openAddExpense=1`);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Transaction
                </button>
              </div>
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

            {/* Action Buttons moved to top-right header */}

            {/* Settle Up Dialog */}
            {isSettleDialogOpen && (
              <div className={`fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 relative">
                  <button
                    onClick={() => setIsSettleDialogOpen(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                  >
                    ✖
                  </button>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Settle Up</h3>

                  <div className="space-y-4">
                    {/* Group Select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group</label>
                      <select
                        value={settleGroupId || ''}
                        onChange={(e) => setSettleGroupId(e.target.value || null)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                      >
                        <option value="">Select group</option>
                        {groupSettlements.map((g) => (
                          <option key={g.group_id} value={g.group_id}>{g.group_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Participants Select */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participants</label>
                      <button
                        type="button"
                        onClick={() => setIsParticipantDropdownOpen(!isParticipantDropdownOpen)}
                        className="w-full flex justify-between items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-left"
                      >
                        <span className="truncate">
                          {selectedParticipants.length > 0
                            ? selectedParticipants.map((id) => memberInfos[id] || id).join(", ")
                            : "Select participants"}
                        </span>
                        <svg className={`w-5 h-5 transition-transform ${isParticipantDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      {isParticipantDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                          <ul>
                            {groupMembers.map((memberId) => (
                              <li
                                key={memberId}
                                onClick={() => handleToggleParticipant(memberId)}
                                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <span>{memberInfos[memberId] || userEmails[memberId] || memberId}</span>
                                {selectedParticipants.includes(memberId) && (
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsSettleDialogOpen(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        onClick={() => {
                          // Placeholder: implement settlement action later
                          setIsSettleDialogOpen(false);
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
