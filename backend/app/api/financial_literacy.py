from fastapi import APIRouter, HTTPException
from app.schemas.financial_literacy import FinancialLiteracyQuery, FinancialLiteracyResponse
from app.database import get_supabase_client
from app.config import settings
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize OpenAI client
openai_client = None
if settings.OPENAI_API_KEY:
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

@router.post("/chat", response_model=FinancialLiteracyResponse)
async def chat_financial_literacy(query: FinancialLiteracyQuery):
    """
    Chat endpoint for financial literacy questions using RAG (Retrieval Augmented Generation).
    
    This endpoint:
    1. Queries Supabase vector DB (finance_chunks table) for similar content
    2. Uses the retrieved context with OpenAI to generate a response
    3. Returns the answer to the student
    """
    if not openai_client:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured"
        )
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Step 1: Generate embedding for the query using OpenAI
        # Using 384 dimensions to match the finance_chunks table structure
        try:
            embedding_response = openai_client.embeddings.create(
                model="text-embedding-3-small",  # Cost-effective embedding model
                input=query.query,
                dimensions=384  # Match the vector dimension in finance_chunks table
            )
            query_embedding = embedding_response.data[0].embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process query embedding"
            )
        
        # Step 2: Perform vector similarity search in finance_chunks table
        # Using Supabase's RPC function for pgvector similarity search
        context = ""
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
        
        # Prepare the prompt for OpenAI
        system_prompt = """You are a helpful financial literacy tutor for students. 
        Answer questions about financial terms and concepts in a clear, educational, and student-friendly manner.
        Use the provided context from the knowledge base when relevant, but also use your general knowledge.
        Keep explanations simple and practical, with examples when helpful."""
        
        user_prompt = f"""Context from knowledge base:
{context}

Student Question: {query.query}

Please provide a clear, educational answer to the student's question about financial literacy."""
        
        # Call OpenAI chat completion
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Using a cost-effective model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        answer = completion.choices[0].message.content
        
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

