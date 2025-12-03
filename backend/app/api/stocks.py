from fastapi import APIRouter, HTTPException, Query
from app.schemas.stock import StockQuery, StockResponse, StockInsightsResponse, NewsArticle
from app.services.news_service import fetch_stock_news
import yfinance as yf
import logging
import os
import httpx
import json
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

# NVIDIA NIM configuration (reuse from financial_literacy pattern)
NIM_ENDPOINT = os.getenv("NIM_ENDPOINT", "https://integrate.api.nvidia.com/v1/chat/completions")
NIM_MODEL = os.getenv("NIM_MODEL", "meta/llama3-8b-instruct")
# Support both NIM_API_KEY and NVIDIA_NIM_API_KEY for consistency
NIM_API_KEY = os.getenv("NVIDIA_NIM_API_KEY") or os.getenv("NIM_API_KEY")

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


async def call_nim_chat_completion(messages: list, model: str = None, max_tokens: int = 1000) -> str:
    """
    Call NVIDIA NIM API for chat completion.
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        model: Model name (defaults to NIM_MODEL)
        max_tokens: Maximum tokens in response
    
    Returns:
        Generated response text
    """
    model = model or NIM_MODEL
    
    if not NIM_API_KEY:
        raise ValueError(
            "NVIDIA NIM API key is required but not configured. "
            "Please set NVIDIA_NIM_API_KEY environment variable."
        )
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {NIM_API_KEY}"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": max_tokens,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(NIM_ENDPOINT, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                raise ValueError("Unexpected response format from NIM API")
    except httpx.ConnectError as e:
        raise ConnectionError(
            f"Failed to connect to NIM endpoint at {NIM_ENDPOINT}. "
            f"Please ensure the NIM server is running. Error: {str(e)}"
        )
    except httpx.TimeoutException as e:
        raise TimeoutError(
            f"Request to NIM endpoint timed out after 30 seconds. "
            f"Endpoint: {NIM_ENDPOINT}. Error: {str(e)}"
        )
    except httpx.HTTPStatusError as e:
        raise ValueError(
            f"NIM API returned error status {e.response.status_code}: {e.response.text}"
        )


@router.get("/insights", response_model=StockInsightsResponse)
async def get_stock_insights(symbol: str = Query(..., description="Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)")):
    """
    Get AI-driven stock insights combining stock data and recent news articles.
    
    This endpoint:
    1. Fetches current stock data
    2. Retrieves recent news articles about the stock
    3. Uses NVIDIA NIM LLM to analyze and generate insights
    4. Returns structured insights with news summaries and recommendation
    """
    try:
        # Step 1: Get stock data
        symbol = symbol.upper().strip()
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Validate stock exists
        if not info or (len(info) <= 1 and 'symbol' not in info):
            raise HTTPException(
                status_code=404,
                detail=f"Stock ticker '{symbol}' cannot be found."
            )
        
        # Get quote data
        quote_data = ticker.history(period="1d", interval="1m")
        current_price = None
        if not quote_data.empty:
            current_price = float(quote_data['Close'].iloc[-1])
        
        if current_price is None:
            current_price = info.get('regularMarketPrice') or info.get('currentPrice')
            if current_price is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Stock ticker '{symbol}' cannot be found."
                )
        
        current_price = float(current_price)
        previous_close = float(info.get('previousClose', current_price))
        change = current_price - previous_close
        change_percent = (change / previous_close * 100) if previous_close > 0 else 0.0
        
        company_name = info.get('longName') or info.get('shortName') or symbol
        
        # Step 2: Fetch recent news articles (last 7 days only)
        news_articles = await fetch_stock_news(symbol, company_name, max_days_old=7)
        
        # Step 3: Prepare stock data summary for AI
        stock_summary = f"""
Stock: {symbol} ({company_name})
Current Price: ${current_price:.2f}
Previous Close: ${previous_close:.2f}
Change: ${change:.2f} ({change_percent:+.2f}%)
Market Cap: {info.get('marketCap', 'N/A')}
P/E Ratio: {info.get('trailingPE') or info.get('forwardPE') or 'N/A'}
Dividend Yield: {info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0:.2f}%
52-Week High: ${info.get('fiftyTwoWeekHigh', 'N/A')}
52-Week Low: ${info.get('fiftyTwoWeekLow', 'N/A')}
Sector: {info.get('sector', 'N/A')}
Industry: {info.get('industry', 'N/A')}
"""
        
        # Step 4: Prepare news articles summary
        news_text = ""
        if news_articles:
            news_text = "\n\nRecent News Articles:\n"
            for i, article in enumerate(news_articles[:10], 1):
                news_text += f"\n{i}. {article.get('title', 'No title')}\n"
                if article.get('summary'):
                    news_text += f"   Summary: {article['summary']}\n"
                if article.get('publisher'):
                    news_text += f"   Source: {article['publisher']}\n"
        else:
            news_text = "\n\nNo recent news articles found."
        
        # Step 5: Call NVIDIA NIM to generate simplified highlight-style insights
        system_prompt = """You are a financial analyst providing simple, highlight-style stock analysis for college students. 
Keep responses concise and easy to scan. Focus on the most important highlights only.
Always emphasize that this is educational content, not financial advice."""

        user_prompt = f"""Analyze the stock data and recent news (last 7 days) for {symbol} ({company_name}) and provide a simple highlight analysis.

Only use the news articles provided - do not reference outdated news. Focus on current information.

Return ONLY valid JSON in this format (no additional text):
{{
  "summary": "One concise sentence about the stock's current situation",
  "highlights": ["Brief highlight 1", "Brief highlight 2", "Brief highlight 3", "Brief highlight 4"],
  "recommendation": "buy|hold|sell|research",
  "riskAssessment": "low|medium|high"
}}

Guidelines:
- SUMMARY: One clear sentence (max 20 words) summarizing the stock's outlook
- HIGHLIGHTS: 4 concise bullet points (max 15 words each) covering:
  * Most important metric or trend
  * Key news impact
  * Valuation or financial health
  * Market sentiment or outlook
- RECOMMENDATION: "buy", "hold", "sell", or "research" based on the analysis
- RISK ASSESSMENT: "low", "medium", or "high" based on volatility and fundamentals

Keep it simple and scannable. Use specific numbers from the data when relevant.

Stock Data:
{stock_summary}

Recent News Articles (Last 7 Days):
{news_text}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            ai_response = await call_nim_chat_completion(messages, max_tokens=800)
            
            # Parse JSON response from AI
            # Sometimes AI adds markdown code blocks, so we need to extract JSON
            ai_response = ai_response.strip()
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            if ai_response.startswith("```"):
                ai_response = ai_response[3:]
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]
            ai_response = ai_response.strip()
            
            try:
                insights_data = json.loads(ai_response)
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract JSON object from text
                import re
                json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if json_match:
                    insights_data = json.loads(json_match.group())
                else:
                    raise ValueError("Could not parse JSON from AI response")
            
            # Validate and extract data from simplified format
            summary = insights_data.get("summary", "Analysis unavailable")
            highlights = insights_data.get("highlights", [])
            recommendation = insights_data.get("recommendation", "research").lower()
            risk_assessment = insights_data.get("riskAssessment", "medium").lower()
            
            # Ensure recommendation is valid
            if recommendation not in ["buy", "hold", "sell", "research"]:
                recommendation = "research"
            
            # Ensure risk assessment is valid
            if risk_assessment not in ["low", "medium", "high"]:
                risk_assessment = "medium"
            
            # Use highlights directly as keyPoints (backward compatible with schema)
            key_points = highlights if highlights else []
            
            # Extract news-related highlights as news summaries, or use actual news if available
            news_summaries = []
            for highlight in highlights:
                if any(keyword in highlight.lower() for keyword in ["news", "announced", "reported", "releases", "earnings", "revenue"]):
                    news_summaries.append(highlight)
            
            # If no news summaries from highlights but we have news articles, create simple summaries
            if not news_summaries and news_articles:
                # Use first few article titles as simple summaries
                news_summaries = [article.get("title", "")[:80] + "..." if len(article.get("title", "")) > 80 else article.get("title", "") 
                                 for article in news_articles[:3] if article.get("title")]
            
            # Convert news articles to schema format
            news_article_models = [
                NewsArticle(
                    title=article.get("title", ""),
                    link=article.get("link", ""),
                    publisher=article.get("publisher"),
                    published_at=article.get("published_at"),
                    summary=article.get("summary")
                )
                for article in news_articles
            ]
            
            return StockInsightsResponse(
                summary=summary,
                keyPoints=key_points,
                newsSummaries=news_summaries,
                recommendation=recommendation,
                riskAssessment=risk_assessment,
                studentFriendly=True,
                educationalNotes=[],  # Empty for simplified format
                newsArticles=news_article_models
            )
            
        except ConnectionError as e:
            logger.error(f"NIM connection error: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Cannot connect to NVIDIA NIM endpoint. Please ensure the NIM server is running."
            )
        except TimeoutError as e:
            logger.error(f"NIM timeout error: {e}")
            raise HTTPException(
                status_code=504,
                detail=f"Request to NVIDIA NIM timed out."
            )
        except ValueError as e:
            error_msg = str(e)
            logger.error(f"NIM API error: {e}")
            if "API key is required" in error_msg:
                raise HTTPException(
                    status_code=401,
                    detail="NVIDIA NIM API key is missing. Please set NVIDIA_NIM_API_KEY environment variable."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Error generating AI insights: {error_msg}"
            )
        except Exception as e:
            logger.error(f"Unexpected error calling NIM API: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error generating AI insights: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating stock insights for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating stock insights: {str(e)}"
        )

