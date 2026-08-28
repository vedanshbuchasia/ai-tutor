import os
import json
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from user_service import user_service, UserProfile
from qdrant_rag import qdrant_rag

class ChalkStep(BaseModel):
    step_num: int
    title: str
    content: str
    latex: Optional[str] = None

class DiagramData(BaseModel):
    velocity: float = 25.0
    angle: float = 45.0
    gravity: float = 9.8
    show_vectors: bool = True

class MasterLesson(BaseModel):
    topic_title: str
    spoken_dialogue: str
    concept_summary: str
    problem_statement: Optional[str] = None
    chalk_steps: List[ChalkStep]
    diagram: DiagramData
    concept_quiz: str
    action_type: Literal["TEACH", "SOLVE_PROBLEM", "ANSWER_TANGENT", "REMEDIATE"]
    user_mastery: int
    current_topic_index: int

# Comprehensive Conceptual & Problem-Solving Curriculum Grounded in RAG
MASTER_CURRICULUM = [
    {
        "index": 0,
        "topic": "Independence of Motion & Vector Decomposition",
        "spoken": "Welcome! Let's understand 2D projectile motion conceptually. Look at our board: all 2D motion is broken down into two completely independent 1D motions. Gravity only acts downward in the vertical y-direction, while the horizontal x-direction moves purely by inertia at a constant speed. Let's solve a real question on the board right now.",
        "concept_summary": "Core Law: Horizontal & Vertical motions do not affect each other.",
        "problem": "Example 1: A ball is kicked at u = 20 m/s at an angle of 30° above the ground. Let's decompose its initial velocity into x and y components.",
        "steps": [
            {
                "step_num": 1,
                "title": "Horizontal Component (vx)",
                "content": "No horizontal force acts on the ball (ax = 0). Thus, vx stays constant forever.",
                "latex": "v_x = u\\cos(30^\\circ) = 20 \\times 0.866 = 17.32\\text{ m/s}"
            },
            {
                "step_num": 2,
                "title": "Vertical Component (vy0)",
                "content": "Gravity accelerates downward (ay = -9.8 m/s²). Initial vertical speed is:",
                "latex": "v_{y0} = u\\sin(30^\\circ) = 20 \\times 0.500 = 10.00\\text{ m/s}"
            },
            {
                "step_num": 3,
                "title": "Position Vector Formulation",
                "content": "At any time t, the position is given by combining both components:",
                "latex": "\\vec{r}(t) = (17.32\\,t)\\hat{i} + (10.0\\,t - 4.9\\,t^2)\\hat{j}"
            }
        ],
        "diagram": { "velocity": 20, "angle": 30, "gravity": 9.8, "show_vectors": True },
        "quiz": "If you drop a tennis ball while throwing another horizontally from the same height, which hits the ground first?"
    },
    {
        "index": 1,
        "topic": "Apex Height & Time of Flight Calculation",
        "spoken": "Now let's solve for the peak height and total airtime! As the ball rises, gravity drains its vertical speed by 9.8 m/s every second. At the highest point (the apex), the vertical velocity vy is momentarily zero. Let's write out the mathematical proof and solve for H_max.",
        "concept_summary": "At maximum height H_max, vertical speed vy = 0. Horizontal speed vx is still 17.32 m/s.",
        "problem": "Example 2: For our kicked ball (u = 20 m/s, θ = 30°), calculate (a) Time to reach apex, (b) Maximum Height H_max, and (c) Total Time of Flight T.",
        "steps": [
            {
                "step_num": 1,
                "title": "Time to Peak (t_apex)",
                "content": "Using vy = vy0 - gt = 0  =>  t_apex = vy0 / g",
                "latex": "t_{\\text{apex}} = \\frac{10.0}{9.8} = 1.02\\text{ seconds}"
            },
            {
                "step_num": 2,
                "title": "Maximum Height (H_max)",
                "content": "Using vy² = vy0² - 2g·H  =>  H_max = vy0² / 2g",
                "latex": "H_{\\max} = \\frac{(10.0)^2}{2 \\times 9.8} = \\frac{100}{19.6} = 5.10\\text{ meters}"
            },
            {
                "step_num": 3,
                "title": "Total Flight Time (T_total)",
                "content": "Because the trajectory is symmetrical in a vacuum, total airtime is double t_apex:",
                "latex": "T_{\\text{total}} = 2 \\times t_{\\text{apex}} = 2 \\times 1.02 = 2.04\\text{ seconds}"
            }
        ],
        "diagram": { "velocity": 20, "angle": 30, "gravity": 9.8, "show_vectors": True },
        "quiz": "At the very top of the trajectory, is the acceleration zero, or is it still 9.8 m/s² downwards?"
    },
    {
        "index": 2,
        "topic": "Horizontal Range & 45° Optimization",
        "spoken": "Let's find how far the ball travels downfield before hitting the ground! The horizontal range is simply horizontal speed times total airtime. Because horizontal speed is constant, we multiply vx by T_total. Let's solve it on the board and see why 45 degrees yields maximum range.",
        "concept_summary": "Range R = vx * T_total = (u² * sin 2θ) / g. Maximized at θ = 45°.",
        "problem": "Example 3: Calculate the horizontal landing distance R for u = 20 m/s, θ = 30°, and compare with launch at θ = 45°.",
        "steps": [
            {
                "step_num": 1,
                "title": "Range for 30° Launch",
                "content": "R = vx × T_total = 17.32 m/s × 2.04 s",
                "latex": "R_{30^\\circ} = 17.32 \\times 2.04 = 35.33\\text{ meters}"
            },
            {
                "step_num": 2,
                "title": "Symmetry Check (60° Launch)",
                "content": "Because sin(2 × 30°) = sin(60°) = sin(2 × 60°), a 60° launch lands at the exact same 35.33m!",
                "latex": "R_{60^\\circ} = \\frac{(20)^2 \\sin(120^\\circ)}{9.8} = 35.33\\text{ meters}"
            },
            {
                "step_num": 3,
                "title": "Maximum Range at 45°",
                "content": "Setting θ = 45° gives sin(90°) = 1 (the absolute maximum possible):",
                "latex": "R_{\\max} = \\frac{u^2}{g} = \\frac{400}{9.8} = 40.82\\text{ meters}"
            }
        ],
        "diagram": { "velocity": 20, "angle": 45, "gravity": 9.8, "show_vectors": True },
        "quiz": "If a cannon fires at 15°, which other complementary angle will land at the exact same distance?"
    }
]

class MasterTutorAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")

    def process_turn(
        self, 
        user_id: str, 
        user_message: str, 
        conversation_history: List[dict] = [],
        api_key_override: Optional[str] = None
    ) -> MasterLesson:
        user_profile = user_service.get_or_create_user(user_id)
        effective_key = api_key_override or self.api_key or os.getenv("GEMINI_API_KEY")

        step_idx = min(user_profile.current_topic_index, len(MASTER_CURRICULUM) - 1)
        curr = MASTER_CURRICULUM[step_idx]

        # 1. Qdrant Semantic Retrieval
        query = user_message if user_message and user_message.lower() not in ["start", "hello", "hi"] else curr["topic"]
        rag_hits = qdrant_rag.search(query, top_k=2)
        rag_context = "\n".join([h["payload"].get("text", "") for h in rag_hits])

        lower_msg = user_message.lower()
        is_tangent = any(w in lower_msg for w in ["what about", "air", "drag", "friction", "why", "how come", "parabola", "apex"])
        is_solve = any(w in lower_msg for w in ["solve", "question", "problem", "example", "calculate", "math"])
        is_start = lower_msg in ["start", "hello", "hi", "hey", ""]

        # 2. Live Google Gemini LLM Generation
        if effective_key and not is_start:
            try:
                import google.generativeai as genai
                genai.configure(api_key=effective_key)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
You are an expert Physics Professor (Richard Feynman / Walter Lewin style) teaching on an interactive chalkboard.
Your goal: Teach physics CONCEPTUALLY through intuition, clear physical mechanisms, AND write out step-by-step problem solving with math derivations on the board.

Current Topic: {curr['topic']}
RAG Reference Notes: {rag_context}
Student: {user_profile.name} (Mastery: {user_profile.mastery_score}%)
Student Said: "{user_message}"

Generate a complete, structured chalkboard lesson responding to the student.

Respond STRICTLY in valid JSON:
{{
  "topic_title": "{curr['topic']}",
  "spoken_dialogue": "Engaging, conversational spoken explanation spoken directly to {user_profile.name}",
  "concept_summary": "1-sentence fundamental physical principle",
  "problem_statement": "Concrete question or concept being derived on the board",
  "chalk_steps": [
    {{
      "step_num": 1,
      "title": "Step 1 Title",
      "content": "Explanation of the physical mechanism",
      "latex": "LaTeX math formula"
    }},
    {{
      "step_num": 2,
      "title": "Step 2 Title",
      "content": "Explanation of calculation",
      "latex": "LaTeX math calculation"
    }}
  ],
  "diagram": {{ "velocity": 22, "angle": 40, "gravity": 9.8, "show_vectors": true }},
  "concept_quiz": "A thought-provoking concept question",
  "action_type": "TEACH | SOLVE_PROBLEM | ANSWER_TANGENT | REMEDIATE",
  "mastery_delta": 10
}}
"""
                res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                data = json.loads(res.text)

                action_type = data.get("action_type", "TEACH")
                mastery_delta = int(data.get("mastery_delta", 10))

                updated_profile = user_service.update_progress(
                    user_id=user_id,
                    topic_name=data.get("topic_title", curr["topic"]),
                    mastery_delta=mastery_delta,
                    advance_topic=(action_type == "TEACH" or is_solve),
                    doubt=user_message if action_type == "ANSWER_TANGENT" else None
                )

                steps = [ChalkStep(**s) for s in data.get("chalk_steps", curr["steps"])]
                diag = DiagramData(**data.get("diagram", curr["diagram"]))

                return MasterLesson(
                    topic_title=data.get("topic_title", curr["topic"]),
                    spoken_dialogue=data.get("spoken_dialogue", curr["spoken"]),
                    concept_summary=data.get("concept_summary", curr["concept_summary"]),
                    problem_statement=data.get("problem_statement", curr["problem"]),
                    chalk_steps=steps,
                    diagram=diag,
                    concept_quiz=data.get("concept_quiz", curr["quiz"]),
                    action_type=action_type,
                    user_mastery=updated_profile.mastery_score,
                    current_topic_index=updated_profile.current_topic_index
                )
            except Exception as e:
                print(f"Gemini generation error: {e}")

        # 3. Comprehensive Adaptive Fallback
        if is_tangent:
            diag = DiagramData(velocity=24, angle=50, gravity=9.8, show_vectors=True)
            steps = [
                ChalkStep(
                    step_num=1,
                    title="Aerodynamic Drag Force",
                    content="In real air, colliding air molecules create a resistive drag force opposing the velocity vector.",
                    latex="\\vec{F}_{\\text{drag}} = -\\frac{1}{2}\\rho C_d A v^2 \\hat{v}"
                ),
                ChalkStep(
                    step_num=2,
                    title="Effect on Trajectory",
                    content="Horizontal speed vx decays over time, causing the descent to be steeper and shortening the range.",
                    latex="R_{\\text{air}} < R_{\\text{vacuum}}, \\quad \\text{Trajectory is asymmetric}"
                )
            ]
            spoken = f"Great doubt, {user_profile.name}! Look at the board: in real air, aerodynamic drag opposes motion proportionally to v squared. This saps horizontal speed and creates an asymmetric path."
            action = "ANSWER_TANGENT"
            mastery_delta = 5
        elif is_solve or not is_start:
            next_idx = min(step_idx + 1, len(MASTER_CURRICULUM) - 1)
            curr = MASTER_CURRICULUM[next_idx]
            spoken = f"Excellent, {user_profile.name}! Let's advance our lesson and solve the next question on the board: {curr['spoken']}"
            steps = [ChalkStep(**s) for s in curr["steps"]]
            diag = DiagramData(**curr["diagram"])
            action = "SOLVE_PROBLEM"
            mastery_delta = 15
        else:
            spoken = f"Hello {user_profile.name}! {curr['spoken']}"
            steps = [ChalkStep(**s) for s in curr["steps"]]
            diag = DiagramData(**curr["diagram"])
            action = "TEACH"
            mastery_delta = 0

        updated_profile = user_service.update_progress(
            user_id=user_id,
            topic_name=curr["topic"],
            mastery_delta=mastery_delta,
            advance_topic=(action in ["TEACH", "SOLVE_PROBLEM"] and not is_start),
            doubt=user_message if action == "ANSWER_TANGENT" else None
        )

        return MasterLesson(
            topic_title=curr["topic"],
            spoken_dialogue=spoken,
            concept_summary=curr["concept_summary"],
            problem_statement=curr["problem"],
            chalk_steps=steps,
            diagram=diag,
            concept_quiz=curr["quiz"],
            action_type=action,
            user_mastery=updated_profile.mastery_score,
            current_topic_index=updated_profile.current_topic_index
        )

tutor_agent = MasterTutorAgent()
