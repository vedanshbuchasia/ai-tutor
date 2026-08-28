import os
import json
from typing import Literal, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
FRAMES_DIR = os.path.join(DATA_DIR, "frames")
KB_PATH = os.path.join(DATA_DIR, "knowledge_base.json")

app = FastAPI(title="Kinematics Multimodal AI Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static frames extracted from lecture video
if os.path.exists(FRAMES_DIR):
    app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")

# Pydantic schema required by specifications
class AgentResponse(BaseModel):
    spoken_dialogue: str = Field(description="Explanation text spoken by the avatar")
    frame_to_display: str = Field(description="Filename of the visual frame to display on the blackboard")
    math_latex: str = Field(description="LaTeX string of mathematical equations to render")
    concept_question: str = Field(description="Check-for-understanding question for the student")
    action_type: Literal["TEACH", "REMEDIATE", "ANSWER_TANGENT"] = Field(description="State action for curriculum")
    step_index: Optional[int] = Field(default=0, description="Current curriculum step")
    total_steps: Optional[int] = Field(default=5, description="Total curriculum steps")

class ChatRequest(BaseModel):
    user_message: str
    current_step: int = 0
    conversation_history: List[dict] = []

# Structured Kinematics curriculum grounded in extracted lecture video keyframes
CURRICULUM_STEPS = [
    {
        "step": 0,
        "title": "Introduction to 2D Kinematics & Projectile Motion",
        "frame": "frame_000.jpg",
        "math_latex": r"\vec{r}(t) = x(t)\hat{i} + y(t)\hat{j}",
        "dialogue": "Welcome to our visual physics lecture! Today we are studying Projectile Motion. Any object thrown into the air moves in two independent dimensions: horizontal and vertical. Notice on the board how we decompose position into independent x and y components.",
        "question": "Can horizontal motion affect the time it takes for a projectile to fall to the ground, or are x and y independent?"
    },
    {
        "step": 1,
        "title": "Horizontal Motion with Zero Acceleration",
        "frame": "frame_005.jpg",
        "math_latex": r"a_x = 0 \implies v_x = u\cos\theta, \quad x(t) = (u\cos\theta)t",
        "dialogue": "Because gravity only acts downward, there is zero horizontal acceleration (a_x = 0). That means horizontal velocity remains completely constant throughout the entire flight!",
        "question": "If initial velocity is 20 m/s at 30 degrees, what is the horizontal velocity vx at any point?"
    },
    {
        "step": 2,
        "title": "Vertical Motion under Gravity",
        "frame": "frame_010.jpg",
        "math_latex": r"a_y = -g \implies v_y(t) = u\sin\theta - gt, \quad y(t) = (u\sin\theta)t - \frac{1}{2}gt^2",
        "dialogue": "Now look at the vertical axis. Gravity constantly pulls downward with acceleration g = 9.8 m/s^2. At the peak of flight, vertical velocity becomes exactly zero for an instant!",
        "question": "What is the vertical velocity vy when the projectile reaches maximum height?"
    },
    {
        "step": 3,
        "title": "Time of Flight & Maximum Height",
        "frame": "frame_020.jpg",
        "math_latex": r"T = \frac{2u\sin\theta}{g}, \quad H_{max} = \frac{u^2\sin^2\theta}{2g}",
        "dialogue": "By setting y(t) = 0, we derive the total Time of Flight T and the Maximum Height H_max. Notice how both depend purely on initial speed and the launch angle theta.",
        "question": "If you double the launch angle from 30 to 60 degrees, does maximum height increase or decrease?"
    },
    {
        "step": 4,
        "title": "Horizontal Range & Optimal Angle",
        "frame": "frame_030.jpg",
        "math_latex": r"R = \frac{u^2 \sin(2\theta)}{g} \implies R_{max} \text{ at } \theta = 45^\circ",
        "dialogue": "Finally, the total horizontal distance traveled is the Range R. Since sin(2*theta) reaches its peak value of 1 at 2*theta = 90 degrees, 45 degrees gives the absolute maximum range in a vacuum!",
        "question": "Which two complementary angles give the exact same horizontal range?"
    }
]

def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        return genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        return None

@app.get("/")
def get_status():
    return {
        "status": "online",
        "app": "Kinematics Multimodal AI Tutor",
        "has_gemini": bool(os.getenv("GEMINI_API_KEY")),
        "frames_available": len(os.listdir(FRAMES_DIR)) if os.path.exists(FRAMES_DIR) else 0
    }

@app.get("/curriculum")
def get_curriculum():
    return {"steps": CURRICULUM_STEPS}

@app.post("/chat", response_model=AgentResponse)
async def chat_with_tutor(req: ChatRequest):
    user_msg = req.user_message.strip()
    step_idx = min(req.current_step, len(CURRICULUM_STEPS) - 1)
    current_lesson = CURRICULUM_STEPS[step_idx]

    # Available frames
    available_frames = os.listdir(FRAMES_DIR) if os.path.exists(FRAMES_DIR) else []
    target_frame = current_lesson["frame"]
    if target_frame not in available_frames and available_frames:
        target_frame = available_frames[0]

    # Check for interruptions or tangent questions vs answering current step
    lower_msg = user_msg.lower()
    is_initial = lower_msg in ["start", "begin", "hello", "hi", "hey", ""]
    is_tangent = any(w in lower_msg for w in ["what is", "why", "how come", "what about", "friction", "air resistance", "vector", "doubt", "explain again"])

    gemini = get_gemini_model()
    if gemini and not is_initial:
        try:
            prompt = f"""
You are an expert, encouraging physics professor teaching Kinematics & Projectile Motion on a visual blackboard.
Current Lesson Step: {step_idx + 1}/{len(CURRICULUM_STEPS)}: {current_lesson['title']}
Current Blackboard Math: {current_lesson['math_latex']}
Current Topic Question: {current_lesson['question']}

Student Message: "{user_msg}"

Determine if the student is:
1. "TEACH": Progressing through the lesson or correctly answering the question.
2. "REMEDIATE": Struggling with the current concept or gave an incorrect answer.
3. "ANSWER_TANGENT": Asking a tangent question, doubt, or off-topic interruption.

Respond ONLY with a valid JSON object matching this schema:
{{
  "spoken_dialogue": "Direct, conversational response to the student spoken by the avatar.",
  "frame_to_display": "{target_frame}",
  "math_latex": "Relevant LaTeX equations to show on blackboard",
  "concept_question": "Next question or follow-up to test comprehension",
  "action_type": "TEACH" | "REMEDIATE" | "ANSWER_TANGENT"
}}
"""
            res = gemini.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            data = json.loads(res.text)
            
            # Next step logic
            next_step = step_idx
            if data.get("action_type") == "TEACH" and step_idx < len(CURRICULUM_STEPS) - 1:
                next_step = step_idx + 1

            return AgentResponse(
                spoken_dialogue=data.get("spoken_dialogue", current_lesson["dialogue"]),
                frame_to_display=data.get("frame_to_display", target_frame),
                math_latex=data.get("math_latex", current_lesson["math_latex"]),
                concept_question=data.get("concept_question", current_lesson["question"]),
                action_type=data.get("action_type", "TEACH"),
                step_index=next_step,
                total_steps=len(CURRICULUM_STEPS)
            )
        except Exception as e:
            print(f"Gemini API fallback: {e}")

    # Deterministic Agentic State Machine (works instantly offline as well)
    if is_initial:
        return AgentResponse(
            spoken_dialogue=current_lesson["dialogue"],
            frame_to_display=target_frame,
            math_latex=current_lesson["math_latex"],
            concept_question=current_lesson["question"],
            action_type="TEACH",
            step_index=step_idx,
            total_steps=len(CURRICULUM_STEPS)
        )
    elif is_tangent:
        # Interruption / Doubt Handling
        tangent_reply = f"Great question regarding '{user_msg}'. Remember, in 2D projectile motion under standard assumptions, air resistance is neglected and gravity is the sole force acting downward. Let's make sure we master this concept before moving forward."
        return AgentResponse(
            spoken_dialogue=tangent_reply,
            frame_to_display=target_frame,
            math_latex=r"\Sigma \vec{F} = m\vec{a} = -mg\hat{j}",
            concept_question=f"Does that clarify your doubt? Let's return: {current_lesson['question']}",
            action_type="ANSWER_TANGENT",
            step_index=step_idx,
            total_steps=len(CURRICULUM_STEPS)
        )
    else:
        # Advance curriculum or remediate
        next_step = min(step_idx + 1, len(CURRICULUM_STEPS) - 1)
        next_lesson = CURRICULUM_STEPS[next_step]
        next_frame = next_lesson["frame"] if next_lesson["frame"] in available_frames else available_frames[min(next_step * 8, len(available_frames)-1)]
        
        return AgentResponse(
            spoken_dialogue=f"Spot on! {next_lesson['dialogue']}",
            frame_to_display=next_frame,
            math_latex=next_lesson["math_latex"],
            concept_question=next_lesson["question"],
            action_type="TEACH",
            step_index=next_step,
            total_steps=len(CURRICULUM_STEPS)
        )
