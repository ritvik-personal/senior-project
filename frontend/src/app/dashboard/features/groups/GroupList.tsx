"use client";

import { useEffect, useState } from "react";

type Group = { id: string; name: string; code: string; members: string[] };

export default function GroupList() {
  const [groups, setGroups] = useState<Group[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("groups") || "[]"); } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    // keep in sync with localStorage in case other components change it
    const onStorage = () => setGroups(JSON.parse(localStorage.getItem("groups") || "[]"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (groups.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">You have no groups yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">My Groups</h3>
      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{g.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Code: {g.code}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // quick drill-down: store selected group id and navigate to dashboard overview tab later
                  localStorage.setItem("activeGroup", g.id);
                  alert(`Selected group "${g.name}" (local).`);
                }}
                className="px-3 py-1 rounded bg-indigo-600 text-white"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
