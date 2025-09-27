/**
 * About Page Component
 * 
 * This page provides information about CampusFin, its mission, and features.
 * It serves as a marketing page to educate visitors about the platform's
 * purpose and value proposition for college students.
 * 
 * Features:
 * - Mission statement and company values
 * - Overview of platform features
 * - Call-to-action sections for user engagement
 * - Consistent branding and navigation
 */

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="p-6 sm:p-8">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/landing" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CampusFin</span>
          </Link>
          <div className="hidden md:flex space-x-8">
            <Link href="/landing#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link>
            <Link href="/about" className="text-blue-600 dark:text-blue-400 font-medium">About</Link>
            <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Log In</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="px-6 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              About <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CampusFin</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Empowering college students with the financial knowledge and tools they need to build a secure financial future.
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-12 mb-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                We believe that financial literacy shouldn't be a luxury. CampusFin was created to bridge the gap between 
                complex financial concepts and the practical needs of college students. Our platform makes financial education 
                accessible, engaging, and relevant to your life as a student.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎓</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Student-Focused</h3>
                  <p className="text-gray-600 dark:text-gray-300">Designed specifically for college life and student needs</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💡</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Practical Learning</h3>
                  <p className="text-gray-600 dark:text-gray-300">Real-world skills you can apply immediately</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Future-Ready</h3>
                  <p className="text-gray-600 dark:text-gray-300">Build habits that will serve you for life</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-12 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-12">What We Offer</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Smart Budgeting</h3>
                <p className="text-gray-600 dark:text-gray-300">Track expenses, set realistic budgets, and learn to manage money with irregular income streams.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Investment Basics</h3>
                <p className="text-gray-600 dark:text-gray-300">Learn about stocks, ETFs, and retirement planning without the jargon.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎓</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Student Resources</h3>
                <p className="text-gray-600 dark:text-gray-300">Everything from managing student loans to finding part-time jobs that pay well.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Financial Education</h3>
                <p className="text-gray-600 dark:text-gray-300">Comprehensive courses and resources designed for your learning style.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Goal Setting</h3>
                <p className="text-gray-600 dark:text-gray-300">Set and track financial goals that make sense for your stage of life.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Community</h3>
                <p className="text-gray-600 dark:text-gray-300">Connect with other students on similar financial journeys.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">Ready to Take Control of Your Finances?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already building their financial future with CampusFin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started Free
              </Link>
              <Link href="/landing#features" className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-6 sm:px-8 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-2xl font-bold">CampusFin</span>
              </div>
              <p className="text-gray-400">
                Empowering college students with financial knowledge and tools for a secure future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/landing#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 CampusFin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
