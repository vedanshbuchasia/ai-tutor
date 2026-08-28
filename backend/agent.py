import os
import json
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from user_service import user_service, UserProfile
from qdrant_rag import qdrant_rag

class WhiteboardAction(BaseModel):
    action_name: str = Field(default="ANIMATE_TRAJECTORY", description="Type of whiteboard animation")
    math_latex: str = Field(description="Mathematical LaTeX formulation")
    velocity: float = 25.0
    angle: float = 45.0
    gravity: float = 9.8
    frame_to_display: str = "frame_000.jpg"
    annotation_text: str = ""

class TutorTurnResponse(BaseModel):
    spoken_dialogue: str
    whiteboard: WhiteboardAction
    concept_question: str
    action_type: Literal["TEACH", "REMEDIATE", "ANSWER_TANGENT"]
    user_mastery: int
    current_topic_index: int
    rag_topic: str

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

        # 1. RAG Vector Retrieval from Qdrant
        query = user_message if user_message and user_message.lower() not in ["start", "hello", "hi"] else "2D Projectile Kinematics Vector Decomposition"
        search_results = qdrant_rag.search(query, top_k=1)
        top_match = search_results[0]["payload"] if search_results else {
            "topic": "2D Vector Decomposition",
            "text": "Position vector is decomposed into independent x and y coordinates: r(t) = x(t)i + y(t)j.",
            "math_latex": r"\vec{r}(t) = (u\cos\theta)t\hat{i} + ((u\sin\theta)t - \frac{1}{2}gt^2)\hat{j}",
            "frame_to_display": "frame_000.jpg",
            "params": {"velocity": 25, "angle": 45, "gravity": 9.8}
        }

        # 2. Check if user is asking a doubt / tangent vs answering curriculum
        lower_msg = user_message.lower()
        is_tangent = any(w in lower_msg for w in ["what about", "air", "drag", "friction", "why", "how come", "vector", "doubt", "explain again"])
        is_start = lower_msg in ["start", "hello", "hi", "hey", ""]

        # 3. Live LLM Generation (if API Key provided)
        if effective_key and not is_start:
            try:
                import google.generativeai as genai
                genai.configure(api_key=effective_key)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
You are a world-class 1-on-1 Personalized Physics Tutor tutoring a student individually on a single whiteboard.
Student Profile:
- Name: {user_profile.name}
- Current Mastery Level: {user_profile.mastery_score}%
- Learning Style: {user_profile.learning_style}

Retrieved Grounded Course Knowledge from Qdrant Vector DB:
- Topic: {top_match.get('topic')}
- Reference Notes: {top_match.get('text')}
- Reference Formula: {top_match.get('math_latex')}
- Keyframe: {top_match.get('frame_to_display')}

Student Said: "{user_message}"

Determine:
1. "TEACH": If advancing topic or student answered correctly.
2. "REMEDIATE": If student is confused or answered incorrectly (give a warm, intuitive breakdown).
3. "ANSWER_TANGENT": If student interrupted with a doubt (air resistance, friction, vector definitions).

Respond STRICTLY with valid JSON:
{{
  "spoken_dialogue": "Conversational, encouraging 1-on-1 explanation spoken directly to student",
  "math_latex": "{top_match.get('math_latex')}",
  "concept_question": "Follow-up check question or next quiz question",
  "action_type": "TEACH | REMEDIATE | ANSWER_TANGENT",
  "velocity": {top_match.get('params', {}).get('velocity', 25)},
  "angle": {top_match.get('params', {}).get('angle', 45)},
  "mastery_delta": 10
}}
"""
                res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                data = json.loads(res.text)

                action_type = data.get("action_type", "TEACH")
                mastery_delta = int(data.get("mastery_delta", 5 if action_type == "TEACH" else -2))
                
                updated_profile = user_service.update_progress(
                    user_id=user_id,
                    topic_name=top_match.get("topic"),
                    mastery_delta=mastery_delta,
                    advance_topic=(action_type == "TEACH"),
                    doubt=user_message if action_type == "ANSWER_TANGENT" else None
                )

                return TutorTurnResponse(
                    spoken_dialogue=data.get("spoken_dialogue", "Let's work through this concept on our board!"),
                    whiteboard=WhiteboardAction(
                        action_name="ANIMATE_TRAJECTORY",
                        math_latex=data.get("math_latex", top_match.get("math_latex")),
                        velocity=float(data.get("velocity", 25)),
                        angle=float(data.get("angle", 45)),
                        gravity=9.8,
                        frame_to_display=top_match.get("frame_to_display", "frame_000.jpg"),
                        annotation_text=f"Topic: {top_match.get('topic')}"
                    ),
                    concept_question=data.get("concept_question", "How does launch angle alter the horizontal range?"),
                    action_type=action_type,
                    user_mastery=updated_profile.mastery_score,
                    current_topic_index=updated_profile.current_topic_index,
                    rag_topic=top_match.get("topic")
                )
            except Exception as e:
                print(f"Gemini API error, using adaptive fallback: {e}")

        # 4. Adaptive Deterministic Fallback Engine
        if is_start:
            dialogue = f"Hello {user_profile.name}! Welcome to your 1-on-1 kinematics coaching session. Today we are mastering 2D Projectile Motion. Look at our whiteboard: we decompose all motion into horizontal (vx) and vertical (vy) vectors. Let's begin!"
            question = "Are the horizontal and vertical motions dependent on each other, or are they completely independent?"
            action = "TEACH"
            mastery_delta = 0
        elif is_tangent:
            dialogue = f"Great doubt, {user_profile.name}! Based on our references on {top_match.get('topic')}: {top_match.get('text')} Let's clear this up on our whiteboard before continuing."
            question = "Does that clarify your doubt? Ready to proceed with the core trajectory derivation?"
            action = "ANSWER_TANGENT"
            mastery_delta = 5
        else:
            dialogue = f"Excellent reasoning, {user_profile.name}! Based on our {top_match.get('topic')} derivation: {top_match.get('text')} Notice how the equations predict the exact parabolic curve."
            question = "What happens to the vertical velocity component vy at maximum peak height?"
            action = "TEACH"
            mastery_delta = 15

        updated_profile = user_service.update_progress(
            user_id=user_id,
            topic_name=top_match.get("topic"),
            mastery_delta=mastery_delta,
            advance_topic=(action == "TEACH" and not is_start),
            doubt=user_message if action == "ANSWER_TANGENT" else None
        )

        return TutorTurnResponse(
            spoken_dialogue=dialogue,
            whiteboard=WhiteboardAction(
                action_name="ANIMATE_TRAJECTORY",
                math_latex=top_match.get("math_latex"),
                velocity=float(top_match.get("params", {}).get("velocity", 25)),
                angle=float(top_match.get("params", {}).get("angle", 45)),
                gravity=9.8,
                frame_to_display=top_match.get("frame_to_display", "frame_000.jpg"),
                annotation_text=f"Concept: {top_match.get('topic')}"
            ),
            concept_question=question,
            action_type=action,
            user_mastery=updated_profile.mastery_score,
            current_topic_index=updated_profile.current_topic_index,
            rag_topic=top_match.get("topic")
        )

tutor_agent = PersonalizedTutorAgent()
