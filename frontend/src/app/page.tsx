import Image from "next/image";
import Link from "next/link";


export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="p-6 sm:p-8">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CampusFin</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
            <Link href="/loginportal" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Log In</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="px-6 sm:px-8 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Master Your Money in
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> College</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The ultimate financial literacy platform designed specifically for college students. 
              Learn budgeting, investing, and financial planning that actually makes sense for your life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/loginportal" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started Free
              </Link>
              <Link href="/dashboard" className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Smart Budgeting</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your expenses, set realistic budgets, and learn to manage your money like a pro. 
                Perfect for students with irregular income.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Investment Basics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Start investing early with our beginner-friendly guides. Learn about stocks, 
                ETFs, and retirement planning without the jargon.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Student-Focused</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Everything is tailored for college life - from managing student loans to 
                finding part-time jobs that actually pay well.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 sm:p-12 text-white text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">Join Thousands of Students</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl sm:text-5xl font-bold mb-2">10K+</div>
                <div className="text-blue-100">Students Learning</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold mb-2">$2.5M</div>
                <div className="text-blue-100">Money Saved</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold mb-2">95%</div>
                <div className="text-blue-100">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-6 sm:px-8">
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
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
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