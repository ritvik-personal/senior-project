"""
News Service for fetching stock-related news articles.
Uses multiple sources with fallbacks for reliability.
"""
import httpx
import logging
import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# NewsAPI configuration (free tier: 100 requests/day)
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
NEWS_API_URL = "https://newsapi.org/v2/everything"

# Alternative: Use Google News RSS (no API key needed)
GOOGLE_NEWS_RSS_URL = "https://news.google.com/rss/search"


def fetch_news_yfinance_sync(symbol: str, company_name: str = None) -> List[Dict]:
    """
    Fetch news using yfinance library (synchronous).
    Returns list of news articles with title, link, and summary.
    """
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        news = ticker.news
        
        if not news:
            return []
        
        articles = []
        for item in news[:10]:  # Limit to 10 most recent
            articles.append({
                "title": item.get("title", ""),
                "link": item.get("link", ""),
                "publisher": item.get("publisher", ""),
                "published_at": item.get("providerPublishTime", None),
                "summary": item.get("summary", "")
            })
        
        # Log article dates for debugging
        if articles:
            dates = [a.get("published_at") for a in articles if a.get("published_at")]
            if dates:
                logger.info(f"Fetched {len(articles)} news articles from yfinance for {symbol}. Date range: {min(dates)} to {max(dates)}")
            else:
                logger.info(f"Fetched {len(articles)} news articles from yfinance for {symbol} (no dates available)")
        else:
            logger.info(f"No news articles found from yfinance for {symbol}")
        return articles
    except Exception as e:
        logger.warning(f"Failed to fetch news from yfinance: {e}")
        return []


async def fetch_news_yfinance(symbol: str, company_name: str = None) -> List[Dict]:
    """
    Async wrapper for yfinance news fetching.
    """
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, fetch_news_yfinance_sync, symbol, company_name)


async def fetch_news_newsapi(symbol: str, company_name: str = None, max_days: int = 7) -> List[Dict]:
    """
    Fetch news using NewsAPI (requires API key).
    Returns list of news articles from the last max_days.
    """
    if not NEWS_API_KEY:
        logger.debug("NewsAPI key not configured, skipping NewsAPI")
        return []
    
    try:
        # Search query: use company name if available, otherwise symbol
        query = company_name if company_name else symbol
        
        # Get news from last max_days
        from_date = (datetime.now() - timedelta(days=max_days)).strftime("%Y-%m-%d")
        
        params = {
            "q": f"{symbol} OR {query}",
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 10,
            "from": from_date,
            "apiKey": NEWS_API_KEY
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(NEWS_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            articles = []
            if data.get("status") == "ok" and data.get("articles"):
                for article in data["articles"][:10]:
                    articles.append({
                        "title": article.get("title", ""),
                        "link": article.get("url", ""),
                        "publisher": article.get("source", {}).get("name", ""),
                        "published_at": article.get("publishedAt"),
                        "summary": article.get("description", "")
                    })
            
            if articles:
                dates = [a.get("published_at") for a in articles if a.get("published_at")]
                if dates:
                    logger.info(f"Fetched {len(articles)} news articles from NewsAPI for {symbol}. Date range: {dates[0]} to {dates[-1]}")
                else:
                    logger.info(f"Fetched {len(articles)} news articles from NewsAPI for {symbol}")
            else:
                logger.info(f"No news articles found from NewsAPI for {symbol}")
            return articles
    except Exception as e:
        logger.warning(f"Failed to fetch news from NewsAPI: {e}")
        return []


async def fetch_stock_news(symbol: str, company_name: str = None, max_days_old: int = 7) -> List[Dict]:
    """
    Fetch recent news articles about a stock symbol.
    Tries multiple sources with fallbacks.
    
    Args:
        symbol: Stock ticker symbol (e.g., "AAPL")
        company_name: Optional company name for better search results
        max_days_old: Maximum age of news articles in days (default: 7)
    
    Returns:
        List of news articles with title, link, publisher, published_at, summary
        (only articles from the last max_days_old days)
    """
    articles = []
    cutoff_date = datetime.now() - timedelta(days=max_days_old)
    
    # Try NewsAPI first if available (has better date filtering)
    if NEWS_API_KEY:
        try:
            newsapi_articles = await fetch_news_newsapi(symbol, company_name)
            articles.extend(newsapi_articles)
            logger.info(f"Fetched {len(newsapi_articles)} articles from NewsAPI")
        except Exception as e:
            logger.warning(f"NewsAPI fetch failed: {e}")
    
    # Try yfinance as primary or fallback (no API key needed)
    try:
        yfinance_news = await fetch_news_yfinance(symbol, company_name)
        # Filter yfinance articles by date (since yfinance doesn't filter itself)
        filtered_yfinance = []
        for article in yfinance_news:
            published_at = article.get("published_at")
            if published_at:
                # Convert timestamp to datetime if it's a Unix timestamp
                if isinstance(published_at, (int, float)):
                    try:
                        article_date = datetime.fromtimestamp(published_at)
                    except (ValueError, OSError):
                        # If timestamp is invalid, skip date filtering for this article
                        filtered_yfinance.append(article)
                        continue
                elif isinstance(published_at, str):
                    try:
                        # Try parsing ISO format
                        article_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    except ValueError:
                        # If parsing fails, include the article (better to have it than not)
                        filtered_yfinance.append(article)
                        continue
                else:
                    # Unknown format, include it
                    filtered_yfinance.append(article)
                    continue
                
                # Only include if within date range
                if article_date >= cutoff_date:
                    filtered_yfinance.append(article)
            else:
                # No published_at date, include it but log a warning
                logger.debug(f"Article '{article.get('title', 'Unknown')}' has no published_at date")
                filtered_yfinance.append(article)
        
        # Avoid duplicates by checking titles
        existing_titles = {a.get("title", "").lower() for a in articles}
        for article in filtered_yfinance:
            if article.get("title", "").lower() not in existing_titles:
                articles.append(article)
        
        logger.info(f"Added {len(filtered_yfinance)} recent articles from yfinance")
    except Exception as e:
        logger.warning(f"yfinance news fetch failed: {e}")
    
    # Sort by published_at (most recent first) and limit to 10
    articles = sorted(
        articles,
        key=lambda x: x.get("published_at") or 0,
        reverse=True
    )[:10]
    
    # Final filter: remove any articles older than max_days_old
    recent_articles = []
    for article in articles:
        published_at = article.get("published_at")
        if published_at:
            if isinstance(published_at, (int, float)):
                try:
                    article_date = datetime.fromtimestamp(published_at)
                except (ValueError, OSError):
                    recent_articles.append(article)  # Include if we can't parse
                    continue
            elif isinstance(published_at, str):
                try:
                    article_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                except ValueError:
                    recent_articles.append(article)  # Include if we can't parse
                    continue
            else:
                recent_articles.append(article)
                continue
            
            if article_date >= cutoff_date:
                recent_articles.append(article)
        else:
            # No date info, include it (better to have some news than none)
            recent_articles.append(article)
    
    logger.info(f"Total recent news articles (last {max_days_old} days) for {symbol}: {len(recent_articles)}")
    return recent_articles

