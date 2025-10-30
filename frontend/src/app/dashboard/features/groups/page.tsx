"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

interface Group {
  group_id: string;
  group_name: string;
  group_code: string;
  group_description?: string;
  created_by: string;
  created_at: string;
  is_admin: boolean;
  joined_at: string;
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Load user groups from API
  const loadUserGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get("groups/my-groups");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (err) {
      console.error("Failed to load groups:", err);
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      const id = getUserIdFromToken(token);
      setUserId(id);
      loadUserGroups();
    } else {
      router.push("/login");
    }
  }, [router]);
  
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !userId) return;
    
    try {
      const response = await api.post("group-info/", {
        group_name: groupName,
        group_description: groupDescription,
      });
      const newGroup = await response.json();
      
      // Reload groups to get the updated list
      await loadUserGroups();
      
      setGroupName("");
      setGroupDescription("");
      alert(`Group "${newGroup.group_name}" created with code: ${newGroup.group_code}`);
    } catch (err) {
      console.error("Failed to create group:", err);
      alert("Failed to create group. Please try again.");
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !userId) return;
    
    try {
      const response = await api.post("groups/join", {
        group_code: joinCode.trim(),
      });
      const result = await response.json();
      
      if (result.success) {
        // Reload groups to get the updated list
        await loadUserGroups();
        setJoinCode("");
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Failed to join group:", err);
      alert("Failed to join group. Please try again.");
    }
  };

  const handleLeaveGroup = async (group_code: string, group_id: string) => {
    if (!userId || !confirm("Are you sure you want to leave this group?")) return;
    try {
      await api.delete(`groups/leave`, {
        body: JSON.stringify({ group_code }),
      });
      // Reload groups to get the updated list
      await loadUserGroups();
      if (expandedGroupId === group_id) setExpandedGroupId(null);
      alert("Successfully left the group");
    } catch (err) {
      console.error("Failed to leave group:", err);
      alert("Failed to leave group. Please try again.");
    }
  };

  // removed inline logout; handled globally in TopNav

  // Groups are already filtered by the API to only show user's groups
  const userGroups = groups;

  return (
    <div>
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
              rows={3}
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
          {loading ? (
            <p className="text-gray-600 dark:text-gray-300">Loading groups...</p>
          ) : error ? (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          ) : userGroups.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">You haven't joined or created any groups yet.</p>
          ) : (
            <div className="space-y-3">
              {userGroups.map((g) => (
                <div
                  key={g.group_id}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 cursor-pointer"
                >
                  <div
                    className="flex justify-between items-center"
                    onClick={() =>
                      setExpandedGroupId(expandedGroupId === g.group_id ? null : g.group_id)
                    }
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {g.group_name}
                        {g.is_admin && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Code: {g.group_code}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveGroup(g.group_code, g.group_id);
                      }}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Leave
                    </button>
                  </div>

                  {expandedGroupId === g.group_id && (
                    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {g.group_description && (
                        <div>
                          <strong className="font-medium">Description:</strong> {g.group_description}
                        </div>
                      )}
                      <div>
                        <strong className="font-medium">Created by:</strong> {g.created_by}
                      </div>
                      <div>
                        <strong className="font-medium">Joined:</strong> {new Date(g.joined_at).toLocaleDateString()}
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