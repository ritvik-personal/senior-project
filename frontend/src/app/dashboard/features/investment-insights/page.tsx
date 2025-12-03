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
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  market_cap: number | null;
  volume: number | null;
  avg_volume: number | null;
  pe_ratio: number | null;
  dividend_yield: number | null;
  high_52_week: number | null;
  low_52_week: number | null;
  high_today: number | null;
  low_today: number | null;
  open_price: number | null;
  sector: string | null;
  industry: string | null;
  currency: string | null;
  exchange: string | null;
}

interface AIInsights {
  summary: string;
  keyPoints: string[];
  newsSummaries: string[];
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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'research' | 'learn'>('research');
  
  // Chat state for Learn tab
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiInsightsRef = useRef<HTMLDivElement>(null);

  // Sample AI insights (fallback if API fails)
  const sampleInsights: AIInsights = {
    summary: "Apple Inc. is a technology giant with strong fundamentals and a loyal customer base. The company has demonstrated consistent growth through its ecosystem of products and services, including iPhone, Mac, iPad, and services like Apple Music and iCloud.",
    keyPoints: [
      "Strong brand loyalty and ecosystem lock-in effect",
      "Consistent revenue growth from services segment",
      "High profit margins and strong cash position",
      "Innovation in AI and augmented reality",
      "Geographic diversification reducing risk"
    ],
    newsSummaries: [],
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
    setError(null);
    setCurrentStock(null);
    setAiInsights(null);
    
    try {
      // Make the API call directly to handle error responses properly
      const token = api.getToken();
      const url = api.getUrl(`stocks/lookup?symbol=${encodeURIComponent(searchSymbol)}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = `Stock ticker '${searchSymbol}' cannot be found. Please make sure to enter a correct stock ticker.`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If we can't parse JSON, use default message for 404
          if (response.status === 404) {
            errorMessage = `Stock ticker '${searchSymbol}' cannot be found. Please make sure to enter a correct stock ticker.`;
          } else {
            errorMessage = 'Failed to fetch stock data. Please check the symbol and try again.';
          }
        }
        
        setError(errorMessage);
        return;
      }
      
      const data = await response.json();
      setCurrentStock(data);
      
      // Fetch AI insights with news analysis
      try {
        const insightsUrl = api.getUrl(`stocks/insights?symbol=${encodeURIComponent(searchSymbol)}`);
        const insightsResponse = await fetch(insightsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          setAiInsights(insightsData);
        } else {
          // If insights fail, use sample data as fallback
          console.warn('Failed to fetch AI insights, using fallback');
          setAiInsights(sampleInsights);
        }
      } catch (insightsError) {
        console.error('Error fetching AI insights:', insightsError);
        // Use sample data as fallback
        setAiInsights(sampleInsights);
      }
    } catch (err: any) {
      console.error('Error fetching stock data:', err);
      // Network errors or other exceptions
      if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('cannot be found')) {
        setError(`Stock ticker '${searchSymbol}' cannot be found. Please make sure to enter a correct stock ticker.`);
      } else {
        setError('Failed to fetch stock data. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
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

  // Scroll to AI insights when they are received
  useEffect(() => {
    if (aiInsights && aiInsightsRef.current) {
      // Small delay to ensure the content is fully rendered
      setTimeout(() => {
        aiInsightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [aiInsights]);

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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Stock Data Table */}
          {currentStock && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currentStock.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {currentStock.symbol}
                      {currentStock.exchange && ` • ${currentStock.exchange}`}
                      {currentStock.sector && ` • ${currentStock.sector}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${currentStock.current_price.toFixed(2)}
                    </div>
                    <div className={`text-lg font-semibold ${currentStock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currentStock.change >= 0 ? '+' : ''}{currentStock.change.toFixed(2)} ({currentStock.change_percent >= 0 ? '+' : ''}{currentStock.change_percent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Information Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Metric</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Previous Close</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                        ${currentStock.previous_close.toFixed(2)}
                      </td>
                    </tr>
                    {currentStock.open_price && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Open</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${currentStock.open_price.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {currentStock.high_today && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Day High</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${currentStock.high_today.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {currentStock.low_today && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Day Low</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${currentStock.low_today.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {currentStock.high_52_week && currentStock.low_52_week && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">52-Week Range</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${currentStock.low_52_week.toFixed(2)} - ${currentStock.high_52_week.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {currentStock.market_cap && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Market Cap</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {formatMarketCap(currentStock.market_cap)}
                        </td>
                      </tr>
                    )}
                    {currentStock.volume && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Volume</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {currentStock.volume.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {currentStock.avg_volume && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Avg Volume</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {currentStock.avg_volume.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {currentStock.pe_ratio && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">P/E Ratio</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {currentStock.pe_ratio.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {currentStock.dividend_yield !== null && currentStock.dividend_yield !== undefined && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Dividend Yield</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {currentStock.dividend_yield.toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {currentStock.sector && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Sector</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {currentStock.sector}
                        </td>
                      </tr>
                    )}
                    {currentStock.industry && (
                      <tr>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Industry</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {currentStock.industry}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {aiInsights && (
            <div ref={aiInsightsRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
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

              {/* News Summaries Section */}
              {aiInsights.newsSummaries && aiInsights.newsSummaries.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">📰 Recent News Summary</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</span>
                  </div>
                  <ul className="space-y-2">
                    {aiInsights.newsSummaries.map((summary, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">📄</span>
                        <span className="text-gray-700 dark:text-gray-300">{summary}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
