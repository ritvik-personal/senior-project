"use client";

import { useSearchParams } from "next/navigation";
import ExpenseTrackingPage from "../dashboard/features/expense-tracking/page";
import TopNav from "../components/TopNav";

export default function ExpensesRoutePage() {
  const searchParams = useSearchParams();
  const openAdd = searchParams.get("openAddExpense") === "1";
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExpenseTrackingPage initialShowAddForm={openAdd} />
      </main>
    </div>
  );
}


