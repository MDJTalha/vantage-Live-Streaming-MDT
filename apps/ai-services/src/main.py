"""
VANTAGE — AI Services Main Orchestrator
Unified API for all AI features
"""
from __future__ import annotations
import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

from data_correction import AIDataCorrection
from recording_summarizer import RecordingSummarizer
from semantic_search import SemanticSearch
from action_item_extractor import ActionItemExtractor
from brain import AutonomousBrain
from utils.logger import get_logger

log = get_logger("VANTAGE-AI")

# Global AI services
ai_services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize AI services on startup."""
    log.info("🧠 Initializing VANTAGE AI Services...")
    
    ai_services['correction'] = AIDataCorrection()
    ai_services['summarizer'] = RecordingSummarizer()
    ai_services['search'] = SemanticSearch()
    ai_services['actions'] = ActionItemExtractor()
    ai_services['brain'] = AutonomousBrain(seed=True)
    
    # Connect all services
    for service in ai_services.values():
        await service.connect()
    
    log.info("✅ All AI services initialized")
    
    yield
    
    # Cleanup on shutdown
    log.info("Shutting down AI services...")
    for service in ai_services.values():
        await service.disconnect()

app = FastAPI(
    title="VANTAGE AI Services",
    description="AI-powered features for VANTAGE platform",
    version="1.0.0",
    lifespan=lifespan,
)


# ==================== REQUEST MODELS ====================

class SearchRequest(BaseModel):
    query: str
    sources: list[str] = ['meetings', 'recordings']
    limit: int = 20
    date_range: dict = None


class ChatRequest(BaseModel):
    message: str
    domain: str = 'general'
    use_tools: bool = False


# ==================== AI ENDPOINTS ====================

@app.get("/health")
async def health_check():
    """Health check for AI services."""
    return {
        'status': 'healthy',
        'services': list(ai_services.keys()),
    }


@app.post("/search")
async def search(request: SearchRequest):
    """Semantic search across VANTAGE data."""
    try:
        search_service = ai_services['search']
        results = await search_service.search(
            query=request.query,
            options={
                'sources': request.sources,
                'limit': request.limit,
                'date_range': request.date_range,
            }
        )
        return results
    except Exception as e:
        log.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize/recording/{recording_id}")
async def summarize_recording(recording_id: str):
    """Generate AI summary for a recording."""
    try:
        summarizer = ai_services['summarizer']
        result = await summarizer.summarize_recording(recording_id)
        return result
    except Exception as e:
        log.error(f"Summarization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize/all-recordings")
async def summarize_all_recordings(limit: int = 50):
    """Summarize all recordings without summaries."""
    try:
        summarizer = ai_services['summarizer']
        result = await summarizer.summarize_all_recordings(limit=limit)
        return result
    except Exception as e:
        log.error(f"Bulk summarization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract/actions/{meeting_id}")
async def extract_action_items(meeting_id: str):
    """Extract action items from a meeting."""
    try:
        extractor = ai_services['actions']
        result = await extractor.extract_from_meeting(meeting_id)
        return result
    except Exception as e:
        log.error(f"Action extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract/actions/all")
async def extract_all_action_items(limit: int = 20):
    """Extract action items from all recent meetings."""
    try:
        extractor = ai_services['actions']
        result = await extractor.extract_from_all_meetings(limit=limit)
        return result
    except Exception as e:
        log.error(f"Bulk action extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/correct/meeting/{meeting_id}")
async def correct_meeting_data(meeting_id: str):
    """Auto-correct meeting data issues."""
    try:
        correction = ai_services['correction']
        result = await correction.correct_meeting_data(meeting_id)
        return result
    except Exception as e:
        log.error(f"Data correction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/audit/quality")
async def audit_data_quality():
    """Run comprehensive data quality audit."""
    try:
        correction = ai_services['correction']
        result = await correction.audit_data_quality()
        return result
    except Exception as e:
        log.error(f"Audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    """AI chat assistant."""
    try:
        brain = ai_services['brain']
        response = brain.chat(
            user_input=request.message,
            use_tools=request.use_tools,
        )
        return {
            'response': response,
            'domain': request.domain,
        }
    except Exception as e:
        log.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/knowledge/build")
async def build_knowledge(limit: int = 50):
    """Build knowledge graph from meetings."""
    try:
        correction = ai_services['correction']
        result = await correction.build_knowledge_from_meetings(limit=limit)
        return result
    except Exception as e:
        log.error(f"Knowledge building failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    """Get AI service statistics."""
    try:
        brain = ai_services['brain']
        return {
            'knowledge_graph': brain.get_knowledge_stats(),
            'metrics': brain.get_metrics(),
        }
    except Exception as e:
        log.error(f"Stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MAIN ====================

if __name__ == '__main__':
    import uvicorn
    
    uvicorn.run(
        app,
        host='0.0.0.0',
        port=5000,
        log_level='info',
    )
