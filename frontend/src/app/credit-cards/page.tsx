"use client";

import CreditCardToolPage from "../dashboard/features/credit-card-tool/page";
import TopNav from "../components/TopNav";

export default function CreditCardsRoutePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreditCardToolPage />
      </main>
    </div>
  );
}


