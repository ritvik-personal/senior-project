/**
 * Sign Up Page Component
 * 
 * This component handles new user registration for the CampusFin platform.
 * Features:
 * - User registration with email, password, and name
 * - Password confirmation validation
 * - Integration with FastAPI backend registration endpoint
 * - Token-based session management
 * - Error handling and loading states
 * - Email verification message displayed after successful registration
 * 
 * The component includes client-side validation for password matching
 * and length requirements before making API calls.
 * After successful sign-up, users are shown a message to verify their email
 * instead of being redirected to the dashboard.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // removed Full Name; original minimal signup: email + password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Call FastAPI backend sign-up endpoint
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store user data and token in localStorage
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        
        console.log("Sign up successful:", data);
        
        // Show email verification message instead of redirecting
        setSignUpSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Sign up failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Sign up error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show email verification message if sign-up was successful
  if (signUpSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="mb-6">
              <svg 
                className="mx-auto h-16 w-16 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Check Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to activate your account.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You must verify your email before you can access your dashboard.
            </p>
            <button 
              onClick={() => router.push("/login")}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              Back to Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Sign up for CampusFin</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Full Name removed */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-3">Already have an account?</p>
          <button 
            onClick={() => router.push("/login")}
            className="w-full border-2 border-blue-600 text-blue-600 dark:text-blue-400 py-2.5 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
