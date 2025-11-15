from pydantic import BaseModel
from typing import Optional

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

