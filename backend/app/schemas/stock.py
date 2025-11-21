from pydantic import BaseModel
from typing import Optional, List

class StockQuery(BaseModel):
    """Schema for stock lookup query"""
    symbol: str

class StockResponse(BaseModel):
    """Schema for stock data response"""
    symbol: str
    name: str
    current_price: float
    previous_close: float
    change: float
    change_percent: float
    market_cap: Optional[float] = None
    volume: Optional[int] = None
    avg_volume: Optional[int] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    high_52_week: Optional[float] = None
    low_52_week: Optional[float] = None
    high_today: Optional[float] = None
    low_today: Optional[float] = None
    open_price: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None


class NewsArticle(BaseModel):
    """Schema for a news article"""
    title: str
    link: str
    publisher: Optional[str] = None
    published_at: Optional[str] = None
    summary: Optional[str] = None


class StockInsightsResponse(BaseModel):
    """Schema for AI-driven stock insights response"""
    summary: str
    keyPoints: List[str]
    newsSummaries: List[str]  # Bullet point summaries of news articles
    recommendation: str  # "buy", "hold", "sell", or "research"
    riskAssessment: str  # "low", "medium", "high"
    studentFriendly: bool
    educationalNotes: List[str]
    newsArticles: List[NewsArticle]  # Full news articles for reference

