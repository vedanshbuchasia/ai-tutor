import os
import json
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from user_service import user_service, UserProfile
from qdrant_rag import qdrant_rag

class BoardActionItem(BaseModel):
    timestamp_ms: int
    action: str = Field(description="Action primitive: draw_axes | trace_curve | write_equation | draw_vector")
    params: Dict[str, Any]

class TimelineScript(BaseModel):
    spoken_audio: str
    board_actions: List[BoardActionItem]

class TutorTurnResponse(BaseModel):
    spoken_dialogue: str
    timeline_script: TimelineScript
    concept_question: str
    action_type: Literal["TEACH", "REMEDIATE", "ANSWER_TANGENT"]
    user_mastery: int
    current_topic_index: int
    rag_topic: str

# 3 Pillars Timeline Curriculum (Synchronized Millisecond Actions)
TIMELINE_CURRICULUM = [
    {
        "index": 0,
        "topic": "The Independence of Perpendicular Motions",
        "audio": "Let's break down 2D projectile motion. Notice how gravity pulls strictly downward on the vertical axis, while the horizontal speed glides forward with zero resistance.",
        "actions": [
          { "timestamp_ms": 0, "action": "draw_axes", "params": { "x_label": "X (Range, ax = 0)", "y_label": "Y (Height, ay = -g)", "style": "hand_drawn" } },
          { "timestamp_ms": 1200, "action": "trace_curve", "params": { "type": "parabola", "v0": 26, "angle": 45, "duration_ms": 3200 } },
          { "timestamp_ms": 2800, "action": "write_equation", "params": { "latex": "1. r(t) = (u·cos θ)t î + ((u·sin θ)t - ½gt²) ĵ", "position": { "x": 190, "y": 18 }, "write_duration_ms": 1800 } },
          { "timestamp_ms": 4200, "action": "write_equation", "params": { "latex": "2. Horizontal vx = u·cos θ [CONSTANT]", "position": { "x": 190, "y": 54 }, "write_duration_ms": 1500 } },
          { "timestamp_ms": 5600, "action": "draw_vector", "params": { "direction": "down", "label": "ay = -g", "color": "highlight" } }
        ],
        "question": "If you drop a coin from your hand while throwing another coin horizontally from the same height, which one hits the ground first?"
    },
    {
        "index": 1,
        "topic": "Horizontal Inertia & Constant Speed",
        "audio": "Because there is no horizontal force in ideal flight, horizontal velocity vx never speeds up or slows down. It remains constant throughout the entire trajectory.",
        "actions": [
          { "timestamp_ms": 0, "action": "draw_axes", "params": { "x_label": "X (Inertial Motion)", "y_label": "Y (Gravity)", "style": "hand_drawn" } },
          { "timestamp_ms": 1000, "action": "trace_curve", "params": { "type": "parabola", "v0": 28, "angle": 35, "duration_ms": 3000 } },
          { "timestamp_ms": 2400, "action": "write_equation", "params": { "latex": "ΣFx = 0 => ax = 0 => vx = u·cos(θ) = CONSTANT", "position": { "x": 190, "y": 20 } } },
          { "timestamp_ms": 4500, "action": "write_equation", "params": { "latex": "x(t) = (u·cos θ) · t", "position": { "x": 190, "y": 56 } } }
        ],
        "question": "What is the horizontal acceleration of a basketball while it is flying in the air?"
    },
    {
        "index": 2,
        "topic": "Vertical Gravitational Deceleration",
        "audio": "Along the vertical y-axis, gravity decelerates the object by 9.8 meters per second every second. At the highest apex peak, vertical velocity momentarily reaches zero.",
        "actions": [
          { "timestamp_ms": 0, "action": "draw_axes", "params": { "x_label": "X (Range)", "y_label": "Y (Apex Peak vy = 0)", "style": "hand_drawn" } },
          { "timestamp_ms": 1100, "action": "trace_curve", "params": { "type": "parabola", "v0": 30, "angle": 55, "duration_ms": 3400 } },
          { "timestamp_ms": 2600, "action": "write_equation", "params": { "latex": "vy(t) = u·sin(θ) - gt", "position": { "x": 190, "y": 20 } } },
          { "timestamp_ms": 4200, "action": "write_equation", "params": { "latex": "At Apex: vy = 0 => H_max = (u²·sin²θ) / 2g", "position": { "x": 190, "y": 56 } } },
          { "timestamp_ms": 5800, "action": "draw_vector", "params": { "direction": "down", "label": "ay = -g", "color": "highlight" } }
        ],
        "question": "At the very top of a projectile's flight, is total velocity zero, or is only vertical velocity zero?"
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

        step_idx = min(user_profile.current_topic_index, len(TIMELINE_CURRICULUM) - 1)
        current_stage = TIMELINE_CURRICULUM[step_idx]

        lower_msg = user_message.lower()
        is_tangent = any(w in lower_msg for w in ["what about", "air", "drag", "friction", "why", "how come", "parabola", "apex"])
        is_start = lower_msg in ["start", "hello", "hi", "hey", ""]

        # 1. Live Gemini LLM Generation with Structured Timeline Output
        if effective_key and not is_start:
            try:
                import google.generativeai as genai
                genai.configure(api_key=effective_key)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
You are an inspiring Physics Professor (Feynman style) controlling an interactive hand-drawn blackboard (Rough.js + SVG handwriting + live vectors).

Current Topic: {current_stage['topic']}
Student: {user_profile.name} (Mastery: {user_profile.mastery_score}%)
Student Said: "{user_message}"

Generate a structured delivery response with millisecond-accurate timeline actions.

Respond STRICTLY in valid JSON:
{{
  "spoken_dialogue": "Engaging, conceptual spoken explanation for {user_profile.name}",
  "timeline_script": {{
    "spoken_audio": "Spoken text matching audio",
    "board_actions": [
      {{ "timestamp_ms": 0, "action": "draw_axes", "params": {{ "x_label": "X (Range)", "y_label": "Y (Height)" }} }},
      {{ "timestamp_ms": 1200, "action": "trace_curve", "params": {{ "type": "parabola", "v0": 26, "angle": 45, "duration_ms": 3200 }} }},
      {{ "timestamp_ms": 2800, "action": "write_equation", "params": {{ "latex": "v_y(t) = u_y - gt", "position": {{ "x": 190, "y": 20 }} }} }},
      {{ "timestamp_ms": 4700, "action": "draw_vector", "params": {{ "direction": "down", "label": "ay = -g" }} }}
    ]
  }},
  "concept_question": "Socratic concept check question",
  "action_type": "TEACH | REMEDIATE | ANSWER_TANGENT",
  "mastery_delta": 10
}}
"""
                res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                data = json.loads(res.text)

                action_type = data.get("action_type", "TEACH")
                mastery_delta = int(data.get("mastery_delta", 10))

                updated_profile = user_service.update_progress(
                    user_id=user_id,
                    topic_name=current_stage["topic"],
                    mastery_delta=mastery_delta,
                    advance_topic=(action_type == "TEACH"),
                    doubt=user_message if action_type == "ANSWER_TANGENT" else None
                )

                t_script = data.get("timeline_script", {})
                b_actions = [BoardActionItem(**a) for a in t_script.get("board_actions", current_stage["actions"])]

                return TutorTurnResponse(
                    spoken_dialogue=data.get("spoken_dialogue", current_stage["audio"]),
                    timeline_script=TimelineScript(
                        spoken_audio=t_script.get("spoken_audio", current_stage["audio"]),
                        board_actions=b_actions
                    ),
                    concept_question=data.get("concept_question", current_stage["question"]),
                    action_type=action_type,
                    user_mastery=updated_profile.mastery_score,
                    current_topic_index=updated_profile.current_topic_index,
                    rag_topic=current_stage["topic"]
                )
            except Exception as e:
                print(f"Gemini timeline error: {e}")

        # 2. Adaptive Fallback Timeline Script
        if is_start:
            dialogue = f"Hello {user_profile.name}! {current_stage['audio']}"
            action = "TEACH"
            mastery_delta = 0
            actions = current_stage["actions"]
        elif is_tangent:
            dialogue = f"Great question, {user_profile.name}! In real life, aerodynamic air resistance acts opposite to the velocity vector (-½ρCdAv²), causing the trajectory to drop sooner."
            action = "ANSWER_TANGENT"
            mastery_delta = 5
            actions = [
                { "timestamp_ms": 0, "action": "draw_axes", "params": { "x_label": "X (Air Drag)", "y_label": "Y (Height)" } },
                { "timestamp_ms": 1000, "action": "trace_curve", "params": { "type": "parabola", "v0": 24, "angle": 50, "duration_ms": 2800 } },
                { "timestamp_ms": 2400, "action": "write_equation", "params": { "latex": "F_drag = -½ ρ · Cd · A · v²", "position": { "x": 190, "y": 20 } } },
                { "timestamp_ms": 4200, "action": "draw_vector", "params": { "direction": "down", "label": "F_drag opposes motion" } }
            ]
        else:
            next_idx = min(step_idx + 1, len(TIMELINE_CURRICULUM) - 1)
            next_stage = TIMELINE_CURRICULUM[next_idx]
            dialogue = f"Excellent physics reasoning, {user_profile.name}! {next_stage['audio']}"
            action = "TEACH"
            mastery_delta = 15
            current_stage = next_stage
            actions = next_stage["actions"]

        updated_profile = user_service.update_progress(
            user_id=user_id,
            topic_name=current_stage["topic"],
            mastery_delta=mastery_delta,
            advance_topic=(action == "TEACH" and not is_start),
            doubt=user_message if action == "ANSWER_TANGENT" else None
        )

        return TutorTurnResponse(
            spoken_dialogue=dialogue,
            timeline_script=TimelineScript(
                spoken_audio=dialogue,
                board_actions=[BoardActionItem(**a) for a in actions]
            ),
            concept_question=current_stage["question"],
            action_type=action,
            user_mastery=updated_profile.mastery_score,
            current_topic_index=updated_profile.current_topic_index,
            rag_topic=current_stage["topic"]
        )

tutor_agent = PersonalizedTutorAgent()
