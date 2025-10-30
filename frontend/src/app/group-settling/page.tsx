"use client";

import TopNav from "../components/TopNav";
import GroupSettlingPage from "../dashboard/features/group-settling/page";

export default function GroupSettlingRoutePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GroupSettlingPage />
      </main>
    </div>
  );
}


