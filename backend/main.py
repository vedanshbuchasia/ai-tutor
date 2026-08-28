from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal

app = FastAPI(title="AI Tutor Backend")

class AgentResponse(BaseModel):
    spoken_dialogue: str = Field(description="Explanation text spoken by the avatar")
    frame_to_display: str = Field(description="Filename of the visual frame to display on the blackboard")
    math_latex: str = Field(description="LaTeX string of any mathematical equations to render")
    concept_question: str = Field(description="Check-for-understanding question for the student")
    action_type: Literal["TEACH", "REMEDIATE", "ANSWER_TANGENT"] = Field(description="The state action for the curriculum")

@app.get("/")
def read_root():
    return {"message": "AI Tutor API is running!"}

@app.post("/chat")
def chat_with_tutor():
    # Placeholder for the RAG and LLM agent logic
    return {"status": "Not implemented yet"}
