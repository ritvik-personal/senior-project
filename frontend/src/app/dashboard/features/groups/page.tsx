"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  description: string;
  code: string;
  members: string[];
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

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem("groups", JSON.stringify(groups));
  }, [groups]);

  /* ---------------- CREATE GROUP ---------------- */
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: groupName,
      description: groupDescription,
      code: crypto.randomUUID().slice(0, 8),
      members: [],
    };

    setGroups([newGroup, ...groups]);
    setGroupName("");
    setGroupDescription("");
    alert(`Group "${newGroup.name}" created with code: ${newGroup.code}`);
  };

  /* ---------------- JOIN GROUP ---------------- */
  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;

    const allGroups: Group[] = JSON.parse(localStorage.getItem("groups") || "[]");
    const found = allGroups.find((g) => g.code === joinCode.trim());

    if (!found) {
      alert("No group found with that code.");
      return;
    }

    if (!found.members.includes("You")) {
      found.members.push("You");
    }

    const updatedGroups = allGroups.map((g) => (g.id === found.id ? found : g));
    setGroups(updatedGroups);
    setJoinCode("");
    alert(`Joined group "${found.name}"`);
  };

  /* ---------------- DELETE / LEAVE GROUP ---------------- */
  const handleDeleteGroup = (id: string) => {
    if (!confirm("Are you sure you want to delete/leave this group?")) return;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (expandedGroupId === id) setExpandedGroupId(null);
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* NAVBAR */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                CampusFin
              </span>
            </div>

            {/* Back + Logout */}
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

      {/* MAIN CONTENT */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Create, join, and manage groups (local only for now)
          </p>
        </div>

        {/* CREATE GROUP */}
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

        {/* JOIN GROUP */}
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

        {/* MY GROUPS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            My Groups
          </h3>
          {groups.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">You have no groups yet.</p>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
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
                        handleDeleteGroup(g.id);
                      }}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>

                  {expandedGroupId === g.id && (
                    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {g.description && <p>{g.description}</p>}
                      {g.members.length > 0 && (
                        <div>
                          <strong className="font-medium">Members:</strong>{" "}
                          {g.members.join(", ")}
                        </div>
                      )}
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
