from fastapi import APIRouter, HTTPException, Query
from app.schemas.stock import StockQuery, StockResponse
import yfinance as yf
import logging
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/lookup", response_model=StockResponse)
async def lookup_stock(symbol: str = Query(..., description="Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)")):
    """
    Lookup stock information by ticker symbol using Yahoo Finance API.
    
    Returns basic stock information similar to what you'd see on Google/Yahoo Finance:
    - Current price, change, change percentage
    - Market cap, volume, P/E ratio
    - 52-week high/low
    - Sector, industry, and other key metrics
    """
    try:
        # Clean the symbol (uppercase, strip whitespace)
        symbol = symbol.upper().strip()
        
        # Fetch stock data using yfinance
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Check if the stock ticker is valid
        # yfinance returns an empty dict or dict with 'regularMarketPrice' as None for invalid tickers
        if not info or (len(info) <= 1 and 'symbol' not in info):
            raise HTTPException(
                status_code=404,
                detail=f"Stock ticker '{symbol}' cannot be found. Please make sure to enter a correct stock ticker."
            )
        
        # Additional check: if we can't get basic info, the ticker is likely invalid
        if info.get('regularMarketPrice') is None and info.get('currentPrice') is None:
            # Try to get historical data as a fallback check
            quote_data = ticker.history(period="5d")
            if quote_data.empty:
                raise HTTPException(
                    status_code=404,
                    detail=f"Stock ticker '{symbol}' cannot be found. Please make sure to enter a correct stock ticker."
                )
        
        # Get current quote data
        quote_data = ticker.history(period="1d", interval="1m")
        
        # Get the latest price from quote data if available
        current_price = None
        if not quote_data.empty:
            current_price = float(quote_data['Close'].iloc[-1])
        
        # Fallback to regularMarketPrice from info if quote_data is empty
        if current_price is None:
            current_price = info.get('regularMarketPrice') or info.get('currentPrice')
            if current_price is None:
                # Try to get from previousClose if available
                previous_close = info.get('previousClose')
                if previous_close:
                    current_price = previous_close
        
        if current_price is None:
            raise HTTPException(
                status_code=404,
                detail=f"Stock ticker '{symbol}' cannot be found. Please make sure to enter a correct stock ticker."
            )
        
        current_price = float(current_price)
        previous_close = float(info.get('previousClose', current_price))
        change = current_price - previous_close
        change_percent = (change / previous_close * 100) if previous_close > 0 else 0.0
        
        # Extract other relevant information
        market_cap = info.get('marketCap')
        volume = info.get('volume') or info.get('regularMarketVolume')
        avg_volume = info.get('averageVolume') or info.get('averageVolume10days')
        pe_ratio = info.get('trailingPE') or info.get('forwardPE')
        dividend_yield = info.get('dividendYield')
        if dividend_yield:
            dividend_yield = float(dividend_yield) * 100  # Convert to percentage
        
        high_52_week = info.get('fiftyTwoWeekHigh')
        low_52_week = info.get('fiftyTwoWeekLow')
        
        # Get today's high/low from quote data
        high_today = None
        low_today = None
        open_price = None
        if not quote_data.empty:
            high_today = float(quote_data['High'].max())
            low_today = float(quote_data['Low'].min())
            open_price = float(quote_data['Open'].iloc[0])
        
        # Fallback to info if quote_data doesn't have it
        if high_today is None:
            high_today = info.get('dayHigh') or info.get('regularMarketDayHigh')
        if low_today is None:
            low_today = info.get('dayLow') or info.get('regularMarketDayLow')
        if open_price is None:
            open_price = info.get('open') or info.get('regularMarketOpen')
        
        # Company information
        name = info.get('longName') or info.get('shortName') or symbol
        sector = info.get('sector')
        industry = info.get('industry')
        currency = info.get('currency')
        exchange = info.get('exchange')
        
        return StockResponse(
            symbol=symbol,
            name=name,
            current_price=round(current_price, 2),
            previous_close=round(previous_close, 2),
            change=round(change, 2),
            change_percent=round(change_percent, 2),
            market_cap=market_cap,
            volume=volume,
            avg_volume=avg_volume,
            pe_ratio=round(pe_ratio, 2) if pe_ratio else None,
            dividend_yield=round(dividend_yield, 2) if dividend_yield else None,
            high_52_week=round(high_52_week, 2) if high_52_week else None,
            low_52_week=round(low_52_week, 2) if low_52_week else None,
            high_today=round(high_today, 2) if high_today else None,
            low_today=round(low_today, 2) if low_today else None,
            open_price=round(open_price, 2) if open_price else None,
            sector=sector,
            industry=industry,
            currency=currency,
            exchange=exchange
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stock data for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching stock data: {str(e)}"
        )

