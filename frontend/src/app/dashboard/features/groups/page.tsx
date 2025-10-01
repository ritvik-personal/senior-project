"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

interface Group {
  id: string;
  name: string;
  description: string;
  code: string;
  members: string[]; // Stores user IDs
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

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("groups") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      const id = getUserIdFromToken(token);
      setUserId(id);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem("groups", JSON.stringify(groups));
  }, [groups]);
  
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !userId) return;
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: groupName,
      description: groupDescription,
      code: crypto.randomUUID().slice(0, 8),
      members: [userId],
    };
    setGroups([newGroup, ...groups]);
    setGroupName("");
    setGroupDescription("");
    alert(`Group "${newGroup.name}" created with code: ${newGroup.code}`);
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !userId) return;
    const groupToJoin = groups.find((g) => g.code === joinCode.trim());
    if (!groupToJoin) {
      alert("No group found with that code.");
      return;
    }
    if (groupToJoin.members.includes(userId)) {
      alert(`You are already in the group "${groupToJoin.name}".`);
      return;
    }
    const updatedGroup = { ...groupToJoin, members: [...groupToJoin.members, userId] };
    setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    setJoinCode("");
    alert(`Joined group "${updatedGroup.name}"`);
  };

  const handleLeaveGroup = (id: string) => {
    if (!userId || !confirm("Are you sure you want to leave this group?")) return;
    const groupToLeave = groups.find((g) => g.id === id);
    if (!groupToLeave) return;
    const updatedMembers = groupToLeave.members.filter((memberId) => memberId !== userId);
    if (updatedMembers.length === 0) {
      setGroups(groups.filter((g) => g.id !== id));
    } else {
      const updatedGroup = { ...groupToLeave, members: updatedMembers };
      setGroups(groups.map((g) => (g.id === id ? updatedGroup : g)));
    }
    if (expandedGroupId === id) setExpandedGroupId(null);
  };

  // 1. THIS FUNCTION IS NOW CORRECTED
  // It matches the working implementation from your Dashboard page.
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
      // Always clear local storage and redirect
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      window.location.href = "/login"; // Using hard redirect for consistency
    }
  };

  const userGroups = userId ? groups.filter(g => g.members.includes(userId)) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                CampusFin
              </span>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Create, join, and manage your groups.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Create Group
          </h3>
          <form onSubmit={handleCreateGroup} className="space-y-3">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full rounded-lg border px-3 py-2 dark:bg-gray-700 dark:text-white"
              required
            />
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Group description (optional)"
              className="w-full rounded-lg border px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Create
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Join Group
          </h3>
          <form onSubmit={handleJoinGroup} className="flex gap-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter group code"
              className="flex-1 rounded-lg border px-3 py-2 dark:bg-gray-700 dark:text-white"
              required
            />
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Join
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            My Groups
          </h3>
          {userGroups.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">You haven't joined or created any groups yet.</p>
          ) : (
            <div className="space-y-3">
              {userGroups.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 cursor-pointer"
                >
                  <div
                    className="flex justify-between items-center"
                    onClick={() =>
                      setExpandedGroupId(expandedGroupId === g.id ? null : g.id)
                    }
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {g.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Code: {g.code}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveGroup(g.id);
                      }}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Leave
                    </button>
                  </div>

                  {expandedGroupId === g.id && (
                    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {g.description && <p>{g.description}</p>}
                      <div>
                          <strong className="font-medium">Members ({g.members.length}):</strong>{" "}
                          {g.members.join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}