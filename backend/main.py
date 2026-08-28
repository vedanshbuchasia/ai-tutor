import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from user_service import user_service, UserProfile
from agent import tutor_agent, TutorTurnResponse
from qdrant_rag import qdrant_rag

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
FRAMES_DIR = os.path.join(DATA_DIR, "frames")

app = FastAPI(
    title="1-on-1 Personalized Multimodal AI Tutor API",
    version="1.0.0",
    description="Scalable, production-ready personalized AI tutoring backend with Qdrant Vector RAG."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(FRAMES_DIR):
    app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")

# --- Request / Response Models ---
class StartSessionRequest(BaseModel):
    user_id: str = Field(default="user_default")
    user_name: str = Field(default="Student")

class TutorInteractRequest(BaseModel):
    user_id: str = Field(default="user_default")
    user_message: str = Field(default="")
    conversation_history: List[dict] = Field(default=[])
    api_key: Optional[str] = None

class ApiKeyConfigRequest(BaseModel):
    api_key: str

# --- API Endpoints ---
@app.get("/")
def get_system_health():
    return {
        "status": "healthy",
        "service": "Personalized AI Tutor Engine (v1)",
        "vector_database": "Qdrant",
        "frames_indexed": len(os.listdir(FRAMES_DIR)) if os.path.exists(FRAMES_DIR) else 0
    }

@app.post("/api/v1/session/start", response_model=UserProfile)
def start_session(req: StartSessionRequest):
    """Initializes or resumes a personal learner profile."""
    profile = user_service.get_or_create_user(user_id=req.user_id, name=req.user_name)
    return profile

@app.get("/api/v1/user/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: str):
    """Fetches personal learning analytics, mastery level, and doubt history."""
    return user_service.get_or_create_user(user_id=user_id)

@app.post("/api/v1/tutor/interact", response_model=TutorTurnResponse)
def tutor_interact(req: TutorInteractRequest):
    """Processes a 1-on-1 personalized teaching turn with Qdrant Vector RAG."""
    response = tutor_agent.process_turn(
        user_id=req.user_id,
        user_message=req.user_message,
        conversation_history=req.conversation_history,
        api_key_override=req.api_key
    )
    return response

@app.post("/api/v1/config/api_key")
def configure_api_key(req: ApiKeyConfigRequest):
    """Configures Gemini API key at runtime."""
    os.environ["GEMINI_API_KEY"] = req.api_key.strip()
    tutor_agent.api_key = req.api_key.strip()
    return {"status": "success", "message": "API key successfully configured"}

# Legacy endpoint fallback for compatibility
@app.post("/chat")
def legacy_chat(req: dict):
    user_id = req.get("user_id", "user_default")
    user_msg = req.get("user_message", "")
    history = req.get("conversation_history", [])
    api_key = req.get("api_key")
    return tutor_agent.process_turn(user_id, user_msg, history, api_key)
