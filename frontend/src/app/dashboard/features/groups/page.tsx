"use client";

import CreateGroupForm from "./CreateGroupForm";
import GroupList from "./GroupList";

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h2>
          <p className="text-gray-600 dark:text-gray-300">Create, join and manage groups (local stub)</p>
        </div>
      </div>

      <CreateGroupForm />
      <GroupList />
    </div>
  );
}
