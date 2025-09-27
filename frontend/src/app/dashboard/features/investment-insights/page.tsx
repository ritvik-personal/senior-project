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

import { useState, useEffect } from "react";

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

interface Portfolio {
  id: string;
  name: string;
  stocks: PortfolioStock[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

interface PortfolioStock {
  symbol: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  gainLoss: number;
  gainLossPercent: number;
}

export default function InvestmentInsightsPage() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [currentStock, setCurrentStock] = useState<StockData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [activeTab, setActiveTab] = useState<'research' | 'portfolio' | 'learn'>('research');

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

  useEffect(() => {
    // Load sample portfolios
    const samplePortfolios: Portfolio[] = [
      {
        id: '1',
        name: 'Tech Growth Portfolio',
        totalValue: 2500,
        totalGainLoss: 125.50,
        totalGainLossPercent: 5.28,
        stocks: [
          {
            symbol: 'AAPL',
            shares: 5,
            purchasePrice: 150.00,
            currentPrice: 175.43,
            gainLoss: 127.15,
            gainLossPercent: 16.95
          },
          {
            symbol: 'MSFT',
            shares: 3,
            purchasePrice: 350.00,
            currentPrice: 378.85,
            gainLoss: 86.55,
            gainLossPercent: 8.25
          }
        ]
      }
    ];
    setPortfolios(samplePortfolios);
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Investment Insights</h2>
          <p className="text-gray-600 dark:text-gray-300">AI-powered stock research with student-friendly analysis</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreatePortfolio(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            📊 Create Portfolio
          </button>
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
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'portfolio'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          📈 Portfolio
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

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {portfolios.map(portfolio => (
            <div key={portfolio.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{portfolio.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300">Virtual Portfolio</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${portfolio.totalValue.toFixed(2)}
                  </div>
                  <div className={`text-lg ${portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.totalGainLoss >= 0 ? '+' : ''}${portfolio.totalGainLoss.toFixed(2)} ({portfolio.totalGainLossPercent >= 0 ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {portfolio.stocks.map(stock => (
                  <div key={stock.symbol} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{stock.symbol}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {stock.shares} shares @ ${stock.purchasePrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${(stock.shares * stock.currentPrice).toFixed(2)}
                      </div>
                      <div className={`text-sm ${stock.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.gainLoss >= 0 ? '+' : ''}${stock.gainLoss.toFixed(2)} ({stock.gainLossPercent >= 0 ? '+' : ''}{stock.gainLossPercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {portfolios.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <span className="text-6xl mb-4 block">📈</span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Portfolios Yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create a virtual portfolio to practice investing and track your learning
              </p>
              <button
                onClick={() => setShowCreatePortfolio(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Portfolio
              </button>
            </div>
          )}
        </div>
      )}

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Investment Basics for Students</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">What is a Stock?</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    A stock represents ownership in a company. When you buy a stock, you become a shareholder.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">P/E Ratio</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Price-to-Earnings ratio compares a company's stock price to its earnings per share. 
                    Lower ratios may indicate undervaluation.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Market Cap</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Market capitalization is the total value of all company shares. 
                    Large-cap stocks are generally more stable.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Dividend Yield</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    The percentage of a company's stock price paid out as dividends annually. 
                    Higher yields can provide steady income.
                  </p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Risk Management</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Never invest more than you can afford to lose. Diversify your portfolio 
                    across different sectors and companies.
                  </p>
                </div>
                
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Long-term Thinking</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Successful investing is about patience and long-term growth. 
                    Don't try to time the market.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Student Investment Tips</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-green-500 mt-1">💡</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Start Small</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    Begin with small amounts you can afford to lose while learning.
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-blue-500 mt-1">📚</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Educate Yourself</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    Read books, follow financial news, and use educational resources.
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-purple-500 mt-1">🎯</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Set Goals</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    Define your investment goals - retirement, house, education, etc.
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-1">⏰</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Time is Your Friend</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    The earlier you start investing, the more time compound interest has to work.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
