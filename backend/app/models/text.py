from typing import Literal, Optional

from pydantic import BaseModel


class ActionRequest(BaseModel):
    action: str
    action_description: str
    text: str
    about_me: str
    preferred_style: str
    tone: str
    document_type: Optional[
        Literal[
            "Custom", "Blog", "Essay", "LinkedIn", "X", "Threads", "Reddit", "Email", "Newsletter"
        ]
    ] = "Custom"


class EvalRequest(BaseModel):
    eval_name: str
    eval_description: str
    text: str


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


class TextResponse(BaseModel):
    text: str
