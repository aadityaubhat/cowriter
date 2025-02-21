from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Union
import openai
import requests
from enum import Enum
from fastapi.responses import JSONResponse
import os

app = FastAPI(title="CoWriter Backend")

# Get allowed origins from environment or default to localhost
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Configurable origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LLMType(str, Enum):
    OPENAI = "openai"
    LLAMA = "llama"


class LLMConnectionRequest(BaseModel):
    type: LLMType
    api_key: Optional[str] = None
    host: Optional[str] = None
    port: Optional[str] = None


class LLMConnectionResponse(BaseModel):
    success: bool
    message: str


class LLMConnectionManager:
    def __init__(self):
        self.llm_type: Optional[LLMType] = None
        self.api_key: Optional[str] = None
        self.host: Optional[str] = None
        self.port: Optional[str] = None
        self.is_connected: bool = False

    def connect_openai(self, api_key: str) -> None:
        openai.api_key = api_key
        # Test the connection
        openai.Model.list()
        self.llm_type = LLMType.OPENAI
        self.api_key = api_key
        self.is_connected = True

    def connect_llama(self, host: str, port: str) -> None:
        # Ensure host has http:// prefix
        if not host.startswith(("http://", "https://")):
            host = f"http://{host}"

        llama_url = f"{host}:{port}/v1/models"  # Using OpenAI-compatible endpoint
        print(f"Attempting to connect to Llama.cpp at: {llama_url}")
        try:
            response = requests.get(llama_url, timeout=5)
            print(f"Llama.cpp connection response: {response.status_code}")
            if response.status_code != 200:
                raise Exception(
                    f"Llama.cpp server returned status code: {response.status_code}"
                )
            self.llm_type = LLMType.LLAMA
            self.host = host
            self.port = port
            self.is_connected = True
        except requests.exceptions.RequestException as e:
            print(f"Error connecting to Llama.cpp: {str(e)}")
            raise

    def disconnect(self) -> None:
        self.llm_type = None
        self.api_key = None
        self.host = None
        self.port = None
        self.is_connected = False

    async def generate_text(self, prompt: str) -> str:
        if not self.is_connected:
            raise Exception("No active LLM connection")

        if self.llm_type == LLMType.OPENAI:
            try:
                response = await openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                )
                return response.choices[0].message.content
            except Exception as e:
                raise Exception(f"OpenAI API error: {str(e)}")

        elif self.llm_type == LLMType.LLAMA:
            try:
                # Using OpenAI-compatible endpoint
                url = f"{self.host}:{self.port}/v1/chat/completions"
                print(f"Sending request to Llama.cpp at: {url}")

                payload = {
                    "model": "Llama-3.2-3B-Instruct",  # Using the model name from your working example
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful writing assistant.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 50000,
                }

                print(f"Request payload: {payload}")
                response = requests.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=30,
                )
                print(f"Llama.cpp response status: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    print(f"Llama.cpp response data: {data}")
                    if "choices" in data and len(data["choices"]) > 0:
                        return data["choices"][0]["message"]["content"]
                    raise Exception("Invalid response format from Llama.cpp")
                raise Exception(
                    f"Llama.cpp server error: {response.status_code} - {response.text}"
                )
            except requests.exceptions.RequestException as e:
                print(f"Llama.cpp request error: {str(e)}")
                raise Exception(f"Llama.cpp request error: {str(e)}")
            except Exception as e:
                print(f"Unexpected error with Llama.cpp: {str(e)}")
                raise

        raise Exception("Unknown LLM type")


# Global LLM connection manager
llm_manager = LLMConnectionManager()


# Models
class ActionRequest(BaseModel):
    action: str
    action_description: str
    text: str
    about_me: str
    preferred_style: str
    tone: str


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


class TextResponse(BaseModel):
    text: str


def format_prompt(request: ActionRequest) -> str:
    """Format the prompt with user context and preferences."""
    return f"""As a writing assistant, please help modify the following text.

User Background:
{request.about_me}

Writing Preferences:
- Style: {request.preferred_style}
- Tone: {request.tone}

Task: {request.action_description}

Original Text:
{request.text}

Please modify the text according to the task, style, and tone preferences. Format your response using Markdown:
- Use # for main headings
- Use ## for subheadings
- Use **bold** for emphasis
- Use *italic* for subtle emphasis
- Use bullet points where appropriate
- Use numbered lists for sequential items
- Use > for quotes or important callouts

Return ONLY the modified text with Markdown formatting. Do not include any other text, comments, or explanations."""


@app.post("/api/connect_llm", response_model=LLMConnectionResponse)
async def connect_llm(request: LLMConnectionRequest):
    """
    Test connection to the specified LLM provider and store the connection
    """
    try:
        # Disconnect existing connection if any
        llm_manager.disconnect()

        if request.type == LLMType.OPENAI:
            if not request.api_key:
                raise HTTPException(
                    status_code=400, detail="API key is required for OpenAI"
                )

            try:
                llm_manager.connect_openai(request.api_key)
                return LLMConnectionResponse(
                    success=True, message="Successfully connected to OpenAI"
                )
            except openai.error.AuthenticationError:
                raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"OpenAI connection error: {str(e)}"
                )

        elif request.type == LLMType.LLAMA:
            if not request.host or not request.port:
                raise HTTPException(
                    status_code=400, detail="Host and port are required for Llama.cpp"
                )

            try:
                llm_manager.connect_llama(request.host, request.port)
                return LLMConnectionResponse(
                    success=True,
                    message="Successfully connected to Llama.cpp server",
                )
            except requests.exceptions.ConnectionError:
                raise HTTPException(
                    status_code=503,
                    detail=f"Could not connect to Llama.cpp server at {request.host}:{request.port}",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Llama.cpp connection error: {str(e)}"
                )

    except HTTPException as http_error:
        return LLMConnectionResponse(success=False, message=http_error.detail)
    except Exception as e:
        return LLMConnectionResponse(
            success=False, message=f"Unexpected error: {str(e)}"
        )


@app.post("/api/submit_action")
async def submit_action(request: ActionRequest) -> dict:
    try:
        print("Sending prompt to LLM:", format_prompt(request))
        response_text = await llm_manager.generate_text(format_prompt(request))
        return {"success": True, "text": response_text}
    except Exception as e:
        print(f"Error processing action: {str(e)}")
        return JSONResponse(
            status_code=500, content={"success": False, "detail": str(e)}
        )


@app.post("/api/chat", response_model=TextResponse)
async def chat(request: ChatRequest):
    """
    Process a chat message using the connected LLM and return a response.
    """
    if not llm_manager.is_connected:
        raise HTTPException(status_code=400, detail="No active LLM connection")

    try:
        context = f"\nContext: {request.context}" if request.context else ""
        prompt = f"{request.message}{context}"
        response_text = await llm_manager.generate_text(prompt)
        return TextResponse(text=response_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "llm_connected": llm_manager.is_connected,
        "llm_type": llm_manager.llm_type,
    }
