"use client";

import SharedWishlistPage from "../dashboard/features/shared-wishlist/page";
import TopNav from "../components/TopNav";

export default function WishlistRoutePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SharedWishlistPage />
      </main>
    </div>
  );
}


