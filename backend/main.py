import os
import json
from typing import Literal, Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from vector_rag import vector_db

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
FRAMES_DIR = os.path.join(DATA_DIR, "frames")

app = FastAPI(title="Multimodal Vector RAG AI Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(FRAMES_DIR):
    app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")

class SimulationParams(BaseModel):
    velocity: float = 25.0
    angle: float = 45.0
    gravity: float = 9.8
    show_vectors: bool = True

class AgentResponse(BaseModel):
    spoken_dialogue: str = Field(description="Explanation text spoken by the avatar")
    frame_to_display: str = Field(description="Filename of the visual frame to display on the blackboard")
    math_latex: str = Field(description="LaTeX string of mathematical equations to render")
    concept_question: str = Field(description="Check-for-understanding question for the student")
    action_type: Literal["TEACH", "REMEDIATE", "ANSWER_TANGENT"] = Field(description="State action")
    simulation_params: Optional[SimulationParams] = Field(default_factory=SimulationParams)
    rag_grounding: Optional[List[Dict[str, Any]]] = Field(default=[], description="Retrieved vector context chunks")
    step_index: Optional[int] = 0
    total_steps: Optional[int] = 5

class ChatRequest(BaseModel):
    user_message: str
    current_step: int = 0
    conversation_history: List[dict] = []
    api_key: Optional[str] = None

class ApiKeyRequest(BaseModel):
    api_key: str

CURRENT_API_KEY = os.getenv("GEMINI_API_KEY", "")

@app.post("/set_api_key")
def set_api_key(req: ApiKeyRequest):
    global CURRENT_API_KEY
    CURRENT_API_KEY = req.api_key.strip()
    vector_db.api_key = CURRENT_API_KEY
    return {"status": "success", "message": "API key updated successfully"}

@app.get("/")
def get_status():
    return {
        "status": "online",
        "total_vectors": len(vector_db.documents),
        "has_api_key": bool(CURRENT_API_KEY),
        "frames_available": len(os.listdir(FRAMES_DIR)) if os.path.exists(FRAMES_DIR) else 0
    }

@app.post("/chat", response_model=AgentResponse)
async def chat_with_tutor(req: ChatRequest):
    user_msg = req.user_message.strip()
    global CURRENT_API_KEY
    if req.api_key:
        CURRENT_API_KEY = req.api_key

    # 1. Execute Vector RAG Search
    retrieval_query = user_msg if user_msg else "Kinematics 2D projectile motion introduction"
    retrieved_docs = vector_db.search(retrieval_query, top_k=2)

    top_chunk = retrieved_docs[0] if retrieved_docs else None
    top_meta = top_chunk["metadata"] if top_chunk else {}

    # Default fallback grounding
    default_frame = top_meta.get("frame_to_display", "frame_000.jpg")
    default_math = top_meta.get("math_latex", r"\vec{r}(t) = (u\cos\theta)t\hat{i} + ((u\sin\theta)t - \frac{1}{2}gt^2)\hat{j}")
    sim_params = SimulationParams(**top_meta.get("params", {"velocity": 25, "angle": 45, "gravity": 9.8}))

    # 2. Check if LLM API is available for live reasoning
    if CURRENT_API_KEY and user_msg:
        try:
            import google.generativeai as genai
            genai.configure(api_key=CURRENT_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")

            context_str = "\n".join([f"- [{doc['metadata'].get('topic')}]: {doc['text']}" for doc in retrieved_docs])
            prompt = f"""
You are an expert, proactive Physics Professor delivering an interactive micro-lesson on Kinematics and Projectile Motion.
Retrieved Multimodal Knowledge Chunks from Vector Database:
{context_str}

Student Message / Input: "{user_msg}"
Current Step: {req.current_step + 1}

Determine the teaching action:
- "TEACH" (delivering lesson or student answered correctly)
- "REMEDIATE" (student made a mistake or is confused)
- "ANSWER_TANGENT" (student asked a doubt or off-topic question like air resistance, vectors, etc.)

Respond strictly with a JSON object:
{{
  "spoken_dialogue": "Engaging conversational explanation spoken directly by avatar",
  "frame_to_display": "{default_frame}",
  "math_latex": "{default_math}",
  "concept_question": "Interactive quiz or comprehension check",
  "action_type": "TEACH | REMEDIATE | ANSWER_TANGENT",
  "velocity": {sim_params.velocity},
  "angle": {sim_params.angle}
}}
"""
            res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            data = json.loads(res.text)

            return AgentResponse(
                spoken_dialogue=data.get("spoken_dialogue", "Let's explore this kinematics concept together on the board!"),
                frame_to_display=data.get("frame_to_display", default_frame),
                math_latex=data.get("math_latex", default_math),
                concept_question=data.get("concept_question", "What happens to vertical velocity at maximum height?"),
                action_type=data.get("action_type", "TEACH"),
                simulation_params=SimulationParams(
                    velocity=float(data.get("velocity", sim_params.velocity)),
                    angle=float(data.get("angle", sim_params.angle)),
                    gravity=9.8
                ),
                rag_grounding=[{"topic": d["metadata"].get("topic"), "score": d.get("similarity_score")} for d in retrieved_docs],
                step_index=min(req.current_step + (1 if data.get("action_type") == "TEACH" else 0), 4),
                total_steps=5
            )
        except Exception as e:
            print(f"Gemini API generation error: {e}")

    # 3. Dynamic RAG Engine (Deterministic Fallback based on Vector Retrieval)
    lower_msg = user_msg.lower()
    is_tangent = any(w in lower_msg for w in ["air", "drag", "friction", "why", "how come", "vector", "doubt"])
    
    action = "ANSWER_TANGENT" if is_tangent else "TEACH"
    dialogue = f"Based on our course references for '{top_meta.get('topic', 'Kinematics')}': {top_meta.get('full_text', '')}"
    if is_tangent:
        dialogue = f"Great doubt! According to our grounded lecture references on {top_meta.get('topic')}: {top_meta.get('full_text')}"

    return AgentResponse(
        spoken_dialogue=dialogue,
        frame_to_display=default_frame,
        math_latex=default_math,
        concept_question=f"Based on this, what is the horizontal acceleration ax during standard projectile flight?",
        action_type=action,
        simulation_params=sim_params,
        rag_grounding=[{"topic": d["metadata"].get("topic"), "score": d.get("similarity_score")} for d in retrieved_docs],
        step_index=min(req.current_step + (1 if action == "TEACH" and user_msg else 0), 4),
        total_steps=5
    )
