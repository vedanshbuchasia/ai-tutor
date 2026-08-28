import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from user_service import user_service, UserProfile
from agent import tutor_agent, MasterLesson

app = FastAPI(
    title="Kinematics AI Master Tutor Backend",
    version="1.0.0",
    description="Full Virtual Classroom with Live Chalkboard Problem Solving, Vector RAG, and Gemini LLM"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SessionStartRequest(BaseModel):
    user_id: str
    user_name: Optional[str] = "Vedansh"

class TutorInteractRequest(BaseModel):
    user_id: str
    user_message: str
    conversation_history: Optional[List[dict]] = []
    api_key: Optional[str] = None

class ConfigApiKeyRequest(BaseModel):
    api_key: str

@app.post("/api/v1/session/start", response_model=UserProfile)
def start_session(req: SessionStartRequest):
    return user_service.get_or_create_user(req.user_id, req.user_name)

@app.post("/api/v1/tutor/interact", response_model=MasterLesson)
def tutor_interact(req: TutorInteractRequest):
    return tutor_agent.process_turn(
        user_id=req.user_id,
        user_message=req.user_message,
        conversation_history=req.conversation_history,
        api_key_override=req.api_key
    )

@app.get("/api/v1/user/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: str):
    profile = user_service.get_or_create_user(user_id)
    return profile

@app.post("/api/v1/config/api_key")
def configure_api_key(req: ConfigApiKeyRequest):
    os.environ["GEMINI_API_KEY"] = req.api_key
    tutor_agent.api_key = req.api_key
    return {"status": "success", "message": "Gemini API key configured successfully"}

# Static Video Keyframes
frames_dir = os.path.join(os.path.dirname(__file__), "..", "data", "frames")
if os.path.exists(frames_dir):
    app.mount("/frames", StaticFiles(directory=frames_dir), name="frames")

@app.get("/health")
def health():
    return {"status": "healthy", "service": "Kinematics Master Tutor API"}
