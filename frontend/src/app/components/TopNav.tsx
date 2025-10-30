"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    if (userData && token) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        await fetch("http://localhost:8000/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  };

  const itemCls = (active: boolean) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      active
        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
    }`;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CampusFin</span>
          </div>

          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Link href="/dashboard" className={itemCls(pathname === "/dashboard")}>📊 Overview</Link>
            <Link href="/expenses" className={itemCls(pathname?.startsWith("/expenses") || false)}>📱 Expenses</Link>
            <Link href="/budgeting-templates" className={itemCls(pathname?.startsWith("/budgeting-templates") || false)}>📊 Budget</Link>
            <Link href="/wishlist" className={itemCls(pathname?.startsWith("/wishlist") || false)}>🛒 Wishlist</Link>
            <Link href="/credit-cards" className={itemCls(pathname?.startsWith("/credit-cards") || false)}>💳 Cards</Link>
            <Link href="/investment-insights" className={itemCls(pathname?.startsWith("/investment-insights") || false)}>📈 Invest</Link>
            <Link href="/group-settling" className={itemCls(pathname?.startsWith("/group-settling") || false)}>💰 Settle</Link>
            <Link href="/groups" className={itemCls(pathname?.startsWith("/groups") || false)}>👥 Groups</Link>
          </div>

          <div className="flex items-center space-x-4">
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
  );
}


