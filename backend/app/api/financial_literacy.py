from fastapi import APIRouter, HTTPException
from app.schemas.financial_literacy import FinancialLiteracyQuery, FinancialLiteracyResponse
from app.database import get_supabase_client
from app.config import settings
import httpx
import logging
import os
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize SentenceTransformer for embeddings
# BAAI/bge-small-en produces 384-dimensional embeddings, matching finance_chunks table
try:
    embedding_model = SentenceTransformer('BAAI/bge-small-en')
    logger.info("SentenceTransformer model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load SentenceTransformer model: {e}")
    embedding_model = None

# NVIDIA NIM configuration
# Can be overridden via environment variables
NIM_ENDPOINT = os.getenv("NIM_ENDPOINT", "https://integrate.api.nvidia.com/v1/chat/completions")
NIM_MODEL = os.getenv("NIM_MODEL", "meta/llama3-8b-instruct" )
NIM_API_KEY = os.getenv("NVIDIA_NIM_API_KEY")

# Log NIM configuration on module load
if NIM_API_KEY:
    logger.info(f"NVIDIA NIM configured - Endpoint: {NIM_ENDPOINT}, Model: {NIM_MODEL}, API Key: {'*' * 10}")
else:
    logger.warning(f"NVIDIA NIM configured but API key not set - Endpoint: {NIM_ENDPOINT}, Model: {NIM_MODEL}")

async def call_nim_chat_completion(messages: list, model: str = None) -> str:
    """
    Call NVIDIA NIM API for chat completion.
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        model: Model name (defaults to NIM_MODEL)
    
    Returns:
        Generated response text
    """
    model = model or NIM_MODEL
    
    # Validate API key is present (required for NVIDIA cloud endpoint)
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
        "max_tokens": 500,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(NIM_ENDPOINT, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            # Extract the message content from NIM response
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

@router.post("/chat", response_model=FinancialLiteracyResponse)
async def chat_financial_literacy(query: FinancialLiteracyQuery):
    """
    Chat endpoint for financial literacy questions using RAG (Retrieval Augmented Generation).
    
    This endpoint:
    1. Queries Supabase vector DB (finance_chunks table) for similar content
    2. Uses the retrieved context with NVIDIA NIM LLM to generate a response
    3. Returns the answer to the student
    """
    if not embedding_model:
        raise HTTPException(
            status_code=500,
            detail="Embedding model not available. SentenceTransformer model failed to load."
        )
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Step 1: Generate embedding for the query using SentenceTransformer
        # BAAI/bge-small-en produces 384-dimensional embeddings, matching finance_chunks table
        query_embedding = None
        try:
            # Generate embedding using SentenceTransformer
            # encode() returns a numpy array, convert to list for JSON serialization
            embedding_array = embedding_model.encode(query.query, normalize_embeddings=True)
            query_embedding = embedding_array.tolist()
            
            # Verify dimension matches (should be 384)
            if len(query_embedding) != 384:
                logger.warning(f"Embedding dimension mismatch: expected 384, got {len(query_embedding)}")
                
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process query embedding"
            )
        
        # Step 2: Perform vector similarity search in finance_chunks table
        # Using Supabase's RPC function for pgvector similarity search
        context = ""
        if query_embedding:
            try:
                # Try using RPC function for vector similarity search
                # This assumes you have a function like match_finance_chunks in Supabase
                response = supabase.rpc(
                    'match_finance_chunks',
                    {
                        'query_embedding': query_embedding,
                        'match_threshold': 0.7,
                        'match_count': 5
                    }
                ).execute()
                
                # Extract context from the matched chunks
                context_chunks = []
                if response.data:
                    for chunk in response.data:
                        # Extract content from the matched chunk
                        content = chunk.get('content') or ''
                        doc_title = chunk.get('doc_title') or ''
                        if content:
                            # Include doc_title as context if available
                            if doc_title:
                                context_chunks.append(f"[From: {doc_title}]\n{content}")
                            else:
                                context_chunks.append(content)
                
                context = "\n\n".join(context_chunks) if context_chunks else ""
                
            except Exception as e:
                logger.warning(f"Vector search RPC failed, trying direct query: {e}")
                # Fallback: Try direct vector search using Supabase's match function
                try:
                    # Alternative: Use Supabase's built-in vector search if available
                    # This is a fallback approach
                    chunks_response = supabase.table('finance_chunks').select('*').limit(5).execute()
                    
                    context_chunks = []
                    if chunks_response.data:
                        for chunk in chunks_response.data:
                            content = chunk.get('content') or chunk.get('text') or chunk.get('chunk_text') or chunk.get('chunk') or ''
                            if content:
                                context_chunks.append(content)
                    
                    context = "\n\n".join(context_chunks) if context_chunks else ""
                    
                except Exception as fallback_error:
                    logger.error(f"Fallback search also failed: {fallback_error}")
                    # If vector search fails completely, proceed without context
                    context = ""
        else:
            # If no embedding available, try to get some random chunks as fallback
            try:
                chunks_response = supabase.table('finance_chunks').select('*').limit(3).execute()
                context_chunks = []
                if chunks_response.data:
                    for chunk in chunks_response.data:
                        content = chunk.get('content') or ''
                        if content:
                            context_chunks.append(content)
                context = "\n\n".join(context_chunks) if context_chunks else ""
            except Exception as e:
                logger.warning(f"Could not retrieve fallback chunks: {e}")
                context = ""
        
        # Prepare the prompt for NVIDIA NIM
        system_prompt = """You are a helpful financial literacy tutor for students. 
        Answer questions about financial terms and concepts in a clear, educational, and student-friendly manner.
        Use the provided context from the knowledge base when relevant, but also use your general knowledge.
        Keep explanations simple and practical, with examples when helpful."""
        
        user_prompt = f"""Context from knowledge base:
{context}

Student Question: {query.query}

Please provide a clear, educational answer to the student's question about financial literacy."""
        
        # Call NVIDIA NIM for chat completion
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            answer = await call_nim_chat_completion(messages)
        except ConnectionError as e:
            logger.error(f"NIM connection error: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Cannot connect to NVIDIA NIM endpoint at {NIM_ENDPOINT}. "
                       f"Please ensure the NIM server is running. "
                       f"Original error: {str(e)}"
            )
        except TimeoutError as e:
            logger.error(f"NIM timeout error: {e}")
            raise HTTPException(
                status_code=504,
                detail=f"Request to NVIDIA NIM timed out. Endpoint: {NIM_ENDPOINT}. "
                       f"Original error: {str(e)}"
            )
        except ValueError as e:
            error_msg = str(e)
            logger.error(f"NIM API error: {e}")
            # Check if it's a missing API key error
            if "API key is required" in error_msg:
                raise HTTPException(
                    status_code=401,
                    detail=f"NVIDIA NIM API key is missing. Please set NVIDIA_NIM_API_KEY environment variable."
                )
            raise HTTPException(
                status_code=500,
                detail=f"NVIDIA NIM API error: {error_msg}"
            )
        except Exception as e:
            logger.error(f"Unexpected error calling NIM API: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error calling NVIDIA NIM: {str(e)}"
            )
        
        return FinancialLiteracyResponse(
            answer=answer,
            sources=None  # Could add source citations if needed
        )
        
    except Exception as e:
        logger.error(f"Error in financial literacy chat: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing financial literacy query: {str(e)}"
        )

