import os
import json
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from user_service import user_service, UserProfile
from qdrant_rag import qdrant_rag

class WhiteboardAction(BaseModel):
    action_name: str = Field(default="TRAJECTORY", description="Type of animation")
    math_latex: str = Field(description="Mathematical LaTeX formulation")
    velocity: float = 25.0
    angle: float = 45.0
    gravity: float = 9.8
    chalk_notes: List[str] = Field(default=[], description="Step-by-step conceptual bullet points to write on board")
    concept_title: str = Field(default="Kinematics Conceptual Foundations")

class TutorTurnResponse(BaseModel):
    spoken_dialogue: str
    whiteboard: WhiteboardAction
    concept_question: str
    action_type: Literal["TEACH", "REMEDIATE", "ANSWER_TANGENT"]
    user_mastery: int
    current_topic_index: int
    rag_topic: str

# Deep Conceptual Stages of Projectile Motion (Feynman/Gemini Style)
CONCEPTUAL_CURRICULUM = [
    {
        "index": 0,
        "topic": "The Independence of Perpendicular Motions",
        "intuition": "Imagine you drop a ball straight down from your left hand, while firing a ball horizontally from your right hand at 100 m/s from the same height. Both balls will hit the floor at the EXACT same millisecond! Why? Because gravity only pulls downwards in the y-direction. It has zero power over the x-direction.",
        "chalk_notes": [
            "• Core Law: Horizontal & Vertical motions are 100% independent.",
            "• Gravity acts purely DOWNWARD (y-axis).",
            "• Horizontal motion has zero force => moves purely by inertia.",
            "• Position: r(t) = x(t)î + y(t)ĵ"
        ],
        "math_latex": r"\vec{r}(t) = x(t)\hat{i} + y(t)\hat{j} = (u\cos\theta)t\hat{i} + \left((u\sin\theta)t - \frac{1}{2}gt^2\right)\hat{j}",
        "question": "If you drop a coin from your hand while throwing another coin horizontally from the same height, which one hits the ground first?",
        "params": {"velocity": 22, "angle": 40, "gravity": 9.8}
    },
    {
        "index": 1,
        "topic": "Horizontal Motion & Inertia (Zero Acceleration)",
        "intuition": "Newton's First Law tells us an object in motion stays in motion unless acted upon by a net force. In ideal projectile flight, there is NO horizontal force pushing or pulling the ball (Sigma F_x = 0). Thus, horizontal speed vx NEVER speeds up or slows down—it remains constant forever!",
        "chalk_notes": [
            "• Newton's 1st Law: No horizontal force => a_x = 0",
            "• Horizontal Velocity: vx = u·cos(θ) = CONSTANT",
            "• Distance covered: x(t) = (u·cos θ) · t",
            "• The ball glides sideways at a steady pace."
        ],
        "math_latex": r"\Sigma F_x = 0 \implies a_x = 0 \implies v_x = u\cos\theta = \text{const}",
        "question": "What is the horizontal acceleration of a basketball while it is in the air after leaving the shooter's hand?",
        "params": {"velocity": 25, "angle": 35, "gravity": 9.8}
    },
    {
        "index": 2,
        "topic": "Vertical Motion & Gravitational Deceleration",
        "intuition": "Unlike the horizontal glide, the vertical motion is in a constant battle with Earth's gravity. As the object rises, gravity drains its vertical speed by 9.8 m/s every single second. At the highest point (the apex), vertical motion pauses for a single instant (vy = 0) before gravity pulls it back down.",
        "chalk_notes": [
            "• Gravity constantly accelerates downward: a_y = -g = -9.8 m/s²",
            "• Vertical speed decreases: vy(t) = u·sin(θ) - gt",
            "• At the Peak (Apex): Vertical speed vy = 0 momentarily!",
            "• Maximum Height: H_max = (u² · sin²θ) / (2g)"
        ],
        "math_latex": r"v_y(t) = u\sin\theta - gt, \quad \text{At Apex: } v_y = 0 \implies H_{max} = \frac{u^2\sin^2\theta}{2g}",
        "question": "At the very top of a projectile's flight, is the total velocity zero, or is only the vertical velocity zero?",
        "params": {"velocity": 28, "angle": 55, "gravity": 9.8}
    },
    {
        "index": 3,
        "topic": "Why Trajectories Form a Parabola",
        "intuition": "Why is the path of a thrown ball always a perfect parabola? Because horizontal distance grows linearly with time (x proportional to t), while vertical height drops quadratically with time (y proportional to t^2). When you substitute t = x / vx into the vertical equation, you get y = Ax - Bx^2, which is the exact mathematical definition of a parabola!",
        "chalk_notes": [
            "• Horizontal: t = x / (u·cos θ)",
            "• Substitute t into vertical displacement y(t)",
            "• Trajectory Equation: y(x) = (tan θ)·x - [g / (2u²·cos²θ)]·x²",
            "• This is a quadratic curve => A pure downward parabola."
        ],
        "math_latex": r"y(x) = (\tan\theta)x - \frac{g}{2u^2\cos^2\theta}x^2 \quad \text{(Parabolic Trajectory)}",
        "question": "If you double the initial speed u, how does the maximum height H_max change?",
        "params": {"velocity": 30, "angle": 45, "gravity": 9.8}
    },
    {
        "index": 4,
        "topic": "Range Optimization & Complementary Angle Symmetry",
        "intuition": "To hit the furthest distance on the ground, you need a compromise: a shallow angle gives high forward speed but no time in the air; a steep angle gives lots of airtime but no forward speed. The perfect mathematical sweet spot is 45 degrees. Furthermore, 30° and 60° land in the exact same spot because sin(2*30°) = sin(2*60°) = sin(60°)!",
        "chalk_notes": [
            "• Total Time of Flight: T = (2u·sin θ) / g",
            "• Horizontal Range: R = (u²·sin 2θ) / g",
            "• Peak Range R_max occurs at θ = 45° (sin 90° = 1)",
            "• Complementary Angles (e.g. 30° & 60°, 20° & 70°) yield IDENTICAL Range!"
        ],
        "math_latex": r"R = \frac{u^2\sin(2\theta)}{g} \implies R_{max} \text{ at } \theta = 45^\circ, \quad R(\theta) = R(90^\circ - \theta)",
        "question": "A cannon fires at 25 degrees and lands 100 meters away. Which other angle will land at the exact same 100 meters?",
        "params": {"velocity": 26, "angle": 45, "gravity": 9.8}
    }
]

class PersonalizedTutorAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")

    def process_turn(
        self, 
        user_id: str, 
        user_message: str, 
        conversation_history: List[dict] = [],
        api_key_override: Optional[str] = None
    ) -> TutorTurnResponse:
        user_profile = user_service.get_or_create_user(user_id)
        effective_key = api_key_override or self.api_key or os.getenv("GEMINI_API_KEY")

        step_idx = min(user_profile.current_topic_index, len(CONCEPTUAL_CURRICULUM) - 1)
        current_concept = CONCEPTUAL_CURRICULUM[step_idx]

        # 1. Qdrant Vector Retrieval for domain grounding
        query = user_message if user_message and user_message.lower() not in ["start", "hello", "hi"] else current_concept["topic"]
        rag_hits = qdrant_rag.search(query, top_k=1)
        top_rag = rag_hits[0]["payload"] if rag_hits else {}

        lower_msg = user_message.lower()
        is_tangent = any(w in lower_msg for w in ["what about", "air", "drag", "friction", "why", "how come", "vector", "doubt", "explain again"])
        is_start = lower_msg in ["start", "hello", "hi", "hey", ""]

        # 2. Live Gemini LLM Generation
        if effective_key and not is_start:
            try:
                import google.generativeai as genai
                genai.configure(api_key=effective_key)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
You are an inspiring, world-class Physics Professor (in the pedagogical style of Richard Feynman).
Your goal is to teach physics CONCEPTUALLY with deep intuitive explanations, physical analogies, and mental models—not just throwing formulas at the student.

Current Curriculum Stage: {current_concept['topic']}
Intuitive Core Concept: {current_concept['intuition']}
RAG Reference Knowledge: {top_rag.get('text', '')}

Student Name: {user_profile.name} (Mastery Level: {user_profile.mastery_score}%)
Student Said: "{user_message}"

Determine:
1. "TEACH": If advancing the lesson or student answered the concept question well.
2. "REMEDIATE": If student has a conceptual misunderstanding (break it down with an everyday analogy).
3. "ANSWER_TANGENT": If student interrupted with a curiosity question (air drag, friction, gravity on other planets).

Respond STRICTLY in valid JSON with:
{{
  "spoken_dialogue": "Rich, engaging, conceptual explanation spoken directly to {user_profile.name} with intuitive physical reasoning.",
  "chalk_notes": [
    "• Point 1: Conceptual mechanism",
    "• Point 2: Physical cause and effect",
    "• Point 3: Key equation or insight"
  ],
  "math_latex": "{current_concept['math_latex']}",
  "concept_question": "A thought-provoking conceptual check question (not a calculation, but a physics concept test)",
  "action_type": "TEACH | REMEDIATE | ANSWER_TANGENT",
  "velocity": {current_concept['params']['velocity']},
  "angle": {current_concept['params']['angle']},
  "mastery_delta": 10
}}
"""
                res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                data = json.loads(res.text)

                action_type = data.get("action_type", "TEACH")
                mastery_delta = int(data.get("mastery_delta", 10 if action_type == "TEACH" else 2))

                updated_profile = user_service.update_progress(
                    user_id=user_id,
                    topic_name=current_concept["topic"],
                    mastery_delta=mastery_delta,
                    advance_topic=(action_type == "TEACH"),
                    doubt=user_message if action_type == "ANSWER_TANGENT" else None
                )

                return TutorTurnResponse(
                    spoken_dialogue=data.get("spoken_dialogue", current_concept["intuition"]),
                    whiteboard=WhiteboardAction(
                        action_name="TRAJECTORY",
                        math_latex=data.get("math_latex", current_concept["math_latex"]),
                        velocity=float(data.get("velocity", current_concept["params"]["velocity"])),
                        angle=float(data.get("angle", current_concept["params"]["angle"])),
                        gravity=9.8,
                        chalk_notes=data.get("chalk_notes", current_concept["chalk_notes"]),
                        concept_title=current_concept["topic"]
                    ),
                    concept_question=data.get("concept_question", current_concept["question"]),
                    action_type=action_type,
                    user_mastery=updated_profile.mastery_score,
                    current_topic_index=updated_profile.current_topic_index,
                    rag_topic=current_concept["topic"]
                )
            except Exception as e:
                print(f"Gemini LLM API error: {e}")

        # 3. Adaptive Feynman-Style Conceptual Fallback Engine
        if is_start:
            dialogue = f"Hello {user_profile.name}! Welcome to your 1-on-1 Physics mastery session. Before looking at math, let's understand the physical reality: {current_concept['intuition']}"
            question = current_concept["question"]
            action = "TEACH"
            mastery_delta = 0
        elif is_tangent:
            dialogue = f"That is a brilliant doubt, {user_profile.name}! In the real world with air resistance, air molecules collide with the ball, creating a resistive drag force that saps its horizontal speed. This makes the trajectory asymmetric and steeper as it falls."
            question = "Does understanding air drag help you see why vacuum projectile physics assumes zero horizontal force?"
            action = "ANSWER_TANGENT"
            mastery_delta = 5
        else:
            # Advance to next conceptual stage
            next_idx = min(step_idx + 1, len(CONCEPTUAL_CURRICULUM) - 1)
            next_concept = CONCEPTUAL_CURRICULUM[next_idx]
            dialogue = f"Spot on, {user_profile.name}! You've grasped this concept. Now let's explore our next stage: {next_concept['topic']}. {next_concept['intuition']}"
            question = next_concept["question"]
            action = "TEACH"
            mastery_delta = 15
            current_concept = next_concept

        updated_profile = user_service.update_progress(
            user_id=user_id,
            topic_name=current_concept["topic"],
            mastery_delta=mastery_delta,
            advance_topic=(action == "TEACH" and not is_start),
            doubt=user_message if action == "ANSWER_TANGENT" else None
        )

        return TutorTurnResponse(
            spoken_dialogue=dialogue,
            whiteboard=WhiteboardAction(
                action_name="TRAJECTORY",
                math_latex=current_concept["math_latex"],
                velocity=float(current_concept["params"]["velocity"]),
                angle=float(current_concept["params"]["angle"]),
                gravity=9.8,
                chalk_notes=current_concept["chalk_notes"],
                concept_title=current_concept["topic"]
            ),
            concept_question=question,
            action_type=action,
            user_mastery=updated_profile.mastery_score,
            current_topic_index=updated_profile.current_topic_index,
            rag_topic=current_concept["topic"]
        )

tutor_agent = PersonalizedTutorAgent()
