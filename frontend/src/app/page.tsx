/**
 * Root page component - redirects to landing page
 * This serves as the main entry point for the application
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to landing page on root access
    router.replace("/landing");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">C</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">CampusFin</h1>
        <p className="text-gray-600">Redirecting to landing page...</p>
      </div>
    </div>
  );
}
