/**
 * Investment Insights Page Component
 * 
 * This component provides AI-powered stock research and investment insights for students.
 * Features:
 * - Live market data integration from financial APIs
 * - AI-generated summaries using NVIDIA NIM hosted LLM model
 * - Student-friendly insights panel with clear explanations
 * - Key metrics analysis (price trends, P/E ratio, dividends)
 * - Educational content (not financial advice)
 * - Portfolio tracking and analysis
 * - Risk assessment and beginner guidance
 * 
 * Educational focus:
 * - Learn about different investment types
 * - Understand market metrics and terminology
 * - Practice with virtual portfolios
 * - Access beginner-friendly explanations
 */

"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  volume: number;
  high52Week: number;
  low52Week: number;
  sector: string;
  industry: string;
}

interface AIInsights {
  summary: string;
  keyPoints: string[];
  riskAssessment: 'low' | 'medium' | 'high';
  studentFriendly: boolean;
  educationalNotes: string[];
  recommendation: 'buy' | 'hold' | 'sell' | 'research';
}


interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function InvestmentInsightsPage() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [currentStock, setCurrentStock] = useState<StockData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'research' | 'learn'>('research');
  
  // Chat state for Learn tab
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sample stock data (in real app, this would come from financial APIs)
  const sampleStocks: StockData[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.43,
      change: 2.15,
      changePercent: 1.24,
      marketCap: 2800000000000,
      peRatio: 28.5,
      dividendYield: 0.5,
      volume: 45000000,
      high52Week: 198.23,
      low52Week: 124.17,
      sector: 'Technology',
      industry: 'Consumer Electronics'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 378.85,
      change: -1.25,
      changePercent: -0.33,
      marketCap: 2800000000000,
      peRatio: 32.1,
      dividendYield: 0.7,
      volume: 25000000,
      high52Week: 384.30,
      low52Week: 309.45,
      sector: 'Technology',
      industry: 'Software'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 142.56,
      change: 3.42,
      changePercent: 2.46,
      marketCap: 1800000000000,
      peRatio: 25.8,
      dividendYield: 0,
      volume: 30000000,
      high52Week: 151.55,
      low52Week: 115.55,
      sector: 'Technology',
      industry: 'Internet'
    }
  ];

  // Sample AI insights (in real app, this would come from NVIDIA NIM LLM)
  const sampleInsights: AIInsights = {
    summary: "Apple Inc. is a technology giant with strong fundamentals and a loyal customer base. The company has demonstrated consistent growth through its ecosystem of products and services, including iPhone, Mac, iPad, and services like Apple Music and iCloud.",
    keyPoints: [
      "Strong brand loyalty and ecosystem lock-in effect",
      "Consistent revenue growth from services segment",
      "High profit margins and strong cash position",
      "Innovation in AI and augmented reality",
      "Geographic diversification reducing risk"
    ],
    riskAssessment: 'medium',
    studentFriendly: true,
    educationalNotes: [
      "P/E ratio of 28.5 is higher than market average, indicating premium valuation",
      "Dividend yield of 0.5% is low but company focuses on growth over dividends",
      "Market cap of $2.8T makes it one of the largest companies globally",
      "Technology sector can be volatile, so consider your risk tolerance"
    ],
    recommendation: 'research'
  };


  const handleSearchStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSymbol) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const stock = sampleStocks.find(s => s.symbol.toUpperCase() === searchSymbol.toUpperCase());
      if (stock) {
        setCurrentStock(stock);
        setAiInsights(sampleInsights);
      }
      setIsLoading(false);
    }, 1500);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'bg-green-100 text-green-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      case 'sell': return 'bg-red-100 text-red-800';
      case 'research': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap}`;
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await api.post('financial-literacy/chat', {
        query: userMessage.content
      });

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Investment Insights</h2>
          <p className="text-gray-600 dark:text-gray-300">AI-powered stock research with student-friendly analysis</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('research')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'research'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🔍 Research Stocks
        </button>
        <button
          onClick={() => setActiveTab('learn')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'learn'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          📚 Learn
        </button>
      </div>

      {/* Research Tab */}
      {activeTab === 'research' && (
        <div className="space-y-6">
          {/* Stock Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Research a Stock</h3>
            <form onSubmit={handleSearchStock} className="flex space-x-4">
              <input
                type="text"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter stock symbol (e.g., AAPL, MSFT, GOOGL)"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Analyzing...' : 'Research'}
              </button>
            </form>
          </div>

          {/* Stock Data */}
          {currentStock && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currentStock.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{currentStock.symbol} • {currentStock.sector}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">${currentStock.price.toFixed(2)}</div>
                  <div className={`text-lg ${currentStock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currentStock.change >= 0 ? '+' : ''}{currentStock.change.toFixed(2)} ({currentStock.changePercent >= 0 ? '+' : ''}{currentStock.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Market Cap</div>
                  <div className="font-bold text-gray-900 dark:text-white">{formatMarketCap(currentStock.marketCap)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">P/E Ratio</div>
                  <div className="font-bold text-gray-900 dark:text-white">{currentStock.peRatio}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Dividend Yield</div>
                  <div className="font-bold text-gray-900 dark:text-white">{currentStock.dividendYield}%</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Volume</div>
                  <div className="font-bold text-gray-900 dark:text-white">{currentStock.volume.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">52-Week Range</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    ${currentStock.low52Week.toFixed(2)} - ${currentStock.high52Week.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Industry</div>
                  <div className="font-medium text-gray-900 dark:text-white">{currentStock.industry}</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {aiInsights && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI-Powered Analysis</h3>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                  🤖 AI Generated
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(aiInsights.riskAssessment)}`}>
                  {aiInsights.riskAssessment.toUpperCase()} RISK
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(aiInsights.recommendation)}`}>
                  {aiInsights.recommendation.toUpperCase()}
                </span>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                <p className="text-gray-700 dark:text-gray-300">{aiInsights.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Points</h4>
                  <ul className="space-y-2">
                    {aiInsights.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Educational Notes</h4>
                  <ul className="space-y-2">
                    {aiInsights.educationalNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">📚</span>
                        <span className="text-gray-700 dark:text-gray-300">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">Educational Purpose Only</div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      This analysis is for educational purposes only and should not be considered as financial advice. 
                      Always do your own research and consider consulting with a financial advisor before making investment decisions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col h-[600px]">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Financial Literacy Chat
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ask me anything about financial terms, definitions, and concepts!
              </p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-2 block">💬</span>
                  <p>Start a conversation! Ask me about financial literacy terms and concepts.</p>
                  <p className="text-sm mt-2">Try: "What is compound interest?" or "Explain diversification"</p>
                </div>
              )}
              
              {chatMessages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about financial terms and concepts..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChatLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
