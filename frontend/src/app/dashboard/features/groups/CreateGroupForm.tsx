"use client";

import { useState } from "react";

export default function CreateGroupForm() {
  const [name, setName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const newGroup = { id: crypto.randomUUID(), name, code: crypto.randomUUID().slice(0,8), members: [] };
    localStorage.setItem("groups", JSON.stringify([newGroup, ...groups]));
    setName("");
    alert(`Group "${newGroup.name}" created (local). Code: ${newGroup.code}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Create Group</h3>
      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="flex-1 rounded-lg border px-3 py-2 dark:bg-gray-700 dark:text-white"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Create</button>
      </form>
    </div>
  );
}
