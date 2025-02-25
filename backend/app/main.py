"""
CoWriter Backend - Main Application Module.

This module initializes the FastAPI application, sets up middleware,
and registers routes for the CoWriter backend.
"""

import os
import re
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional, Protocol, cast

import openai
import requests
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai.types.chat import ChatCompletion
from pydantic import BaseModel, Field

# Create application
app = FastAPI(
    title="CoWriter Backend",
    description="Backend API for CoWriter, an AI-powered writing assistant",
    version="1.0.0",
)

# Get allowed origins from environment or default to localhost
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models and Enums
class LLMType(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    LLAMA = "llama"


class LLMConnectionRequest(BaseModel):
    """Model for requesting a connection to an LLM provider."""

    type: LLMType
    api_key: Optional[str] = Field(None, description="API key for OpenAI")
    host: Optional[str] = Field(None, description="Host for Llama.cpp server")
    port: Optional[str] = Field(None, description="Port for Llama.cpp server")


class LLMConnectionResponse(BaseModel):
    """Response model for LLM connection requests."""

    success: bool
    message: str


class ActionRequest(BaseModel):
    """Model for submitting a text modification action."""

    action: str = Field(..., description="Action name")
    action_description: str = Field(..., description="Detailed description of the action")
    text: str = Field(..., description="Text to be modified")
    about_me: str = Field(..., description="User background information")
    preferred_style: str = Field(..., description="Preferred writing style")
    tone: str = Field(..., description="Desired tone for the text")


class ActionResponse(BaseModel):
    """Response model for action requests."""

    success: bool
    text: Optional[str] = None
    detail: Optional[str] = None


class EvalRequest(BaseModel):
    """Model for submitting a text evaluation request."""

    eval_name: str = Field(..., description="Name of the evaluation criteria")
    eval_description: str = Field(..., description="Detailed description of evaluation criteria")
    text: str = Field(..., description="Text to be evaluated")


class EvalResponse(BaseModel):
    """Response model for evaluation requests."""

    success: bool
    result: Optional[str] = None
    score: Optional[int] = None
    detail: Optional[str] = None


class ChatRequest(BaseModel):
    """Model for chat message requests."""

    message: str = Field(..., description="Chat message from user")
    context: Optional[str] = Field(None, description="Additional context for the chat")


class TextResponse(BaseModel):
    """Simple text response model."""

    text: str


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str
    llm_connected: bool
    llm_type: Optional[LLMType] = None


# Interface definitions
class LLMProvider(Protocol):
    """Protocol defining LLM provider interface."""

    @abstractmethod
    async def generate_text(self, prompt: str) -> str:
        """Generate text from a prompt."""
        pass

    @property
    @abstractmethod
    def is_connected(self) -> bool:
        """Check if provider is connected."""
        pass

    @property
    @abstractmethod
    def provider_type(self) -> LLMType:
        """Get the provider type."""
        pass


class PromptFormatter(Protocol):
    """Protocol defining prompt formatter interface."""

    @abstractmethod
    def format_prompt(self, request: Any) -> str:
        """Format a prompt based on the request."""
        pass


class ResultProcessor(Protocol):
    """Protocol defining result processor interface."""

    @abstractmethod
    def process_result(self, result: str) -> Dict[str, Any]:
        """Process the LLM result."""
        pass


# Prompt formatters
class ActionPromptFormatter:
    """Formats prompts for text modification actions."""

    def format_prompt(self, request: ActionRequest) -> str:
        """Format the prompt with user context and preferences."""
        return f"""As a writing assistant, please help modify the following text.  # noqa: E501

User Background:
{request.about_me}

Writing Preferences:
- Style: {request.preferred_style}
- Tone: {request.tone}

Task: {request.action_description}

Original Text:
{request.text}

Please modify the text according to the task, style, and tone preferences. Format your response using Markdown:  # noqa: E501
- Use # for main headings
- Use ## for subheadings
- Use **bold** for emphasis
- Use *italic* for subtle emphasis
- Use bullet points where appropriate
- Use numbered lists for sequential items
- Use > for quotes or important callouts

Return ONLY the modified text with Markdown formatting. Do not include any other text, comments, or explanations."""  # noqa: E501


class EvalPromptFormatter:
    """Formats prompts for text evaluation."""

    def format_prompt(self, request: EvalRequest) -> str:
        """Format the prompt for evaluation."""
        return f"""As a writing assistant, please evaluate the following text based on the specified criteria.  # noqa: E501

Evaluation Criteria: {request.eval_description}

Text to Evaluate:
{request.text}

Please provide a detailed evaluation of the text based on the specified criteria. Your evaluation should:
1. Start with a brief summary of your assessment
2. Include specific examples from the text to support your evaluation
3. Provide a numerical rating on a scale of 0-10 (where 0 is the worst and 10 is the best)
4. Offer constructive suggestions for improvement

IMPORTANT: You MUST include a clear numerical score between 0 and 10 in your evaluation.
Format it as "Rating: X/10" where X is the score.

Format your response using Markdown:
- Use **bold** for emphasis
- Use *italic* for subtle emphasis
- Use bullet points where appropriate
- Use > for important callouts

Return ONLY the evaluation with Markdown formatting. Do not include any other text, comments, or explanations."""  # noqa: E501


class ChatPromptFormatter:
    """Formats chat prompts."""

    def format_prompt(self, request: ChatRequest) -> str:
        """Format a chat prompt."""
        context = f"\nContext: {request.context}" if request.context else ""
        return f"{request.message}{context}"


# Result processors
class ActionResultProcessor:
    """Processes action results."""

    def process_result(self, result: str) -> Dict[str, Any]:
        """Process action result."""
        return {"success": True, "text": result}


class EvalResultProcessor:
    """Processes evaluation results and extracts scores."""

    def process_result(self, result: str) -> Dict[str, Any]:
        """Process evaluation result and extract score."""
        # Extract score from the response
        score = 5  # Default score
        rating_match = re.search(r"rating:?\s*(\d+)(?:\s*\/\s*10)?", result, re.IGNORECASE)
        score_match = re.search(r"score:?\s*(\d+)(?:\s*\/\s*10)?", result, re.IGNORECASE)

        if rating_match and rating_match.group(1):
            extracted_score = int(rating_match.group(1))
            if 0 <= extracted_score <= 10:
                score = extracted_score
        elif score_match and score_match.group(1):
            extracted_score = int(score_match.group(1))
            if 0 <= extracted_score <= 10:
                score = extracted_score

        return {"success": True, "result": result, "score": score}


class ChatResultProcessor:
    """Processes chat results."""

    def process_result(self, result: str) -> Dict[str, Any]:
        """Process chat result."""
        return {"text": result}


# LLM Provider implementations
class BaseLLMProvider(ABC):
    """Base class for LLM providers."""

    @abstractmethod
    async def generate_text(self, prompt: str) -> str:
        """Generate text from a prompt."""
        pass

    @property
    @abstractmethod
    def is_connected(self) -> bool:
        """Check if provider is connected."""
        pass

    @property
    @abstractmethod
    def provider_type(self) -> LLMType:
        """Get the provider type."""
        pass


class OpenAIProvider(BaseLLMProvider):
    """OpenAI LLM provider implementation."""

    def __init__(self) -> None:
        """Initialize the OpenAI provider."""
        self._api_key: Optional[str] = None
        self._is_connected = False
        self._model = "gpt-3.5-turbo"

    def connect(self, api_key: str) -> None:
        """Connect to the OpenAI API."""
        openai.api_key = api_key
        # Test the connection
        try:
            openai.models.list()
            self._api_key = api_key
            self._is_connected = True
        except Exception as e:
            raise Exception(f"Failed to connect to OpenAI: {str(e)}")

    def disconnect(self) -> None:
        """Disconnect from the OpenAI API."""
        self._api_key = None
        self._is_connected = False

    async def generate_text(self, prompt: str) -> str:
        """Generate text using OpenAI API."""
        if not self._is_connected:
            raise Exception("Not connected to OpenAI")

        try:
            response: ChatCompletion = openai.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
            )
            return str(response.choices[0].message.content)
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    @property
    def is_connected(self) -> bool:
        """Check if provider is connected."""
        return self._is_connected

    @property
    def provider_type(self) -> LLMType:
        """Get the provider type."""
        return LLMType.OPENAI


class LlamaProvider(BaseLLMProvider):
    """Llama.cpp LLM provider implementation."""

    def __init__(self) -> None:
        """Initialize the Llama provider."""
        self._host: Optional[str] = None
        self._port: Optional[str] = None
        self._is_connected = False
        self._model = "Llama-3.2-3B-Instruct"
        self._system_prompt = "You are a helpful writing assistant. You take the user's prompt and return a modified text according to the user's preferences."

    def connect(self, host: str, port: str) -> None:
        """Connect to Llama.cpp server."""
        # Ensure host has http:// prefix
        if not host.startswith(("http://", "https://")):
            host = f"http://{host}"

        llama_url = f"{host}:{port}/v1/models"  # Using OpenAI-compatible endpoint
        try:
            response = requests.get(llama_url, timeout=5)
            if response.status_code != 200:
                raise Exception(f"Llama.cpp server returned status code: {response.status_code}")
            self._host = host
            self._port = port
            self._is_connected = True
        except requests.exceptions.RequestException as e:
            raise Exception(f"Error connecting to Llama.cpp: {str(e)}")

    def disconnect(self) -> None:
        """Disconnect from Llama.cpp server."""
        self._host = None
        self._port = None
        self._is_connected = False

    async def generate_text(self, prompt: str) -> str:
        """Generate text using Llama.cpp."""
        if not self._is_connected or not self._host or not self._port:
            raise Exception("Not connected to Llama.cpp server")

        try:
            url = f"{self._host}:{self._port}/v1/chat/completions"

            payload = {
                "model": self._model,
                "messages": [
                    {
                        "role": "system",
                        "content": self._system_prompt,
                    },
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 50000,
            }

            response = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    return str(data["choices"][0]["message"]["content"])
                raise Exception("Invalid response format from Llama.cpp")

            error_msg = f"Llama.cpp server error: {response.status_code} - {response.text}"
            raise Exception(error_msg)

        except requests.exceptions.RequestException as e:
            raise Exception(f"Llama.cpp request error: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error with Llama.cpp: {str(e)}")

    @property
    def is_connected(self) -> bool:
        """Check if provider is connected."""
        return self._is_connected

    @property
    def provider_type(self) -> LLMType:
        """Get the provider type."""
        return LLMType.LLAMA


# LLM Provider Registry
class LLMProviderRegistry:
    """Registry for available LLM providers."""

    def __init__(self) -> None:
        """Initialize the registry with available providers."""
        self._providers: Dict[LLMType, BaseLLMProvider] = {
            LLMType.OPENAI: OpenAIProvider(),
            LLMType.LLAMA: LlamaProvider(),
        }
        self._active_provider: Optional[BaseLLMProvider] = None

    def get_provider(self, provider_type: LLMType) -> BaseLLMProvider:
        """Get a provider by type."""
        if provider_type not in self._providers:
            raise ValueError(f"Unsupported provider type: {provider_type}")
        return self._providers[provider_type]

    def set_active_provider(self, provider_type: LLMType) -> None:
        """Set the active provider."""
        self._active_provider = self.get_provider(provider_type)

    def get_active_provider(self) -> Optional[BaseLLMProvider]:
        """Get the currently active provider."""
        return self._active_provider

    @property
    def available_providers(self) -> List[LLMType]:
        """Get list of available provider types."""
        return list(self._providers.keys())


# Service classes
class LLMConnectionService:
    """Service for managing LLM connections."""

    def __init__(self, provider_registry: LLMProviderRegistry) -> None:
        """Initialize with provider registry."""
        self.provider_registry = provider_registry

    def connect_openai(self, api_key: str) -> LLMConnectionResponse:
        """Connect to OpenAI."""
        try:
            provider = cast(OpenAIProvider, self.provider_registry.get_provider(LLMType.OPENAI))
            provider.connect(api_key)
            self.provider_registry.set_active_provider(LLMType.OPENAI)
            return LLMConnectionResponse(
                success=True,
                message="Successfully connected to OpenAI",
            )
        except openai.AuthenticationError:
            raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
        except Exception as e:
            error_msg = f"OpenAI connection error: {str(e)}"
            raise HTTPException(status_code=500, detail=error_msg)

    def connect_llama(self, host: str, port: str) -> LLMConnectionResponse:
        """Connect to Llama.cpp."""
        try:
            provider = cast(LlamaProvider, self.provider_registry.get_provider(LLMType.LLAMA))
            provider.connect(host, port)
            self.provider_registry.set_active_provider(LLMType.LLAMA)
            return LLMConnectionResponse(
                success=True,
                message="Successfully connected to Llama.cpp server",
            )
        except requests.exceptions.ConnectionError:
            error_msg = f"Could not connect to Llama.cpp server at {host}:{port}"
            raise HTTPException(status_code=503, detail=error_msg)
        except Exception as e:
            error_msg = f"Llama.cpp connection error: {str(e)}"
            raise HTTPException(status_code=500, detail=error_msg)

    def disconnect_all(self) -> None:
        """Disconnect all providers."""
        for provider_type in self.provider_registry.available_providers:
            provider = self.provider_registry.get_provider(provider_type)
            if isinstance(provider, OpenAIProvider):
                provider.disconnect()
            elif isinstance(provider, LlamaProvider):
                provider.disconnect()


class TextGenerationService:
    """Service for generating text with LLMs."""

    def __init__(
        self,
        provider_registry: LLMProviderRegistry,
        formatter: PromptFormatter,
        processor: ResultProcessor,
    ) -> None:
        """Initialize with dependencies."""
        self.provider_registry = provider_registry
        self.formatter = formatter
        self.processor = processor

    async def generate(self, request: Any) -> Dict[str, Any]:
        """Generate text based on request."""
        active_provider = self.provider_registry.get_active_provider()
        if not active_provider or not active_provider.is_connected:
            raise HTTPException(status_code=400, detail="No active LLM connection")

        try:
            prompt = self.formatter.format_prompt(request)
            result = await active_provider.generate_text(prompt)
            return self.processor.process_result(result)
        except Exception as e:
            return {"success": False, "detail": str(e)}


# Initialize global registry
LLM_PROVIDER_REGISTRY = LLMProviderRegistry()

# Initialize formatters and processors
ACTION_FORMATTER = ActionPromptFormatter()
ACTION_PROCESSOR = ActionResultProcessor()
EVAL_FORMATTER = EvalPromptFormatter()
EVAL_PROCESSOR = EvalResultProcessor()
CHAT_FORMATTER = ChatPromptFormatter()
CHAT_PROCESSOR = ChatResultProcessor()


# Function to get dependencies - used to avoid flake8 B008 warning
def get_dependency_provider() -> Dict[str, Any]:
    # Dependency injection functions
    def get_provider_registry() -> LLMProviderRegistry:
        """Get the LLM provider registry."""
        return LLM_PROVIDER_REGISTRY

    def get_connection_service(
        provider_registry: LLMProviderRegistry = Depends(get_provider_registry),
    ) -> LLMConnectionService:
        """Get the LLM connection service."""
        return LLMConnectionService(provider_registry)

    def get_action_service(
        provider_registry: LLMProviderRegistry = Depends(get_provider_registry),
    ) -> TextGenerationService:
        """Get the action service."""
        return TextGenerationService(
            provider_registry,
            ACTION_FORMATTER,
            ACTION_PROCESSOR,
        )

    def get_eval_service(
        provider_registry: LLMProviderRegistry = Depends(get_provider_registry),
    ) -> TextGenerationService:
        """Get the evaluation service."""
        return TextGenerationService(
            provider_registry,
            EVAL_FORMATTER,
            EVAL_PROCESSOR,
        )

    def get_chat_service(
        provider_registry: LLMProviderRegistry = Depends(get_provider_registry),
    ) -> TextGenerationService:
        """Get the chat service."""
        return TextGenerationService(
            provider_registry,
            CHAT_FORMATTER,
            CHAT_PROCESSOR,
        )

    return {
        "get_provider_registry": get_provider_registry,
        "get_connection_service": get_connection_service,
        "get_action_service": get_action_service,
        "get_eval_service": get_eval_service,
        "get_chat_service": get_chat_service,
    }


# Get dependency providers
deps = get_dependency_provider()
get_provider_registry = deps["get_provider_registry"]
get_connection_service = deps["get_connection_service"]
get_action_service = deps["get_action_service"]
get_eval_service = deps["get_eval_service"]
get_chat_service = deps["get_chat_service"]


# API routes
@app.post("/api/connect_llm", response_model=LLMConnectionResponse)
async def connect_llm(
    request: LLMConnectionRequest,
    connection_service: LLMConnectionService = Depends(get_connection_service),
) -> LLMConnectionResponse:
    """Test connection to the specified LLM provider and store the connection."""
    try:
        # Disconnect existing connections
        connection_service.disconnect_all()

        if request.type == LLMType.OPENAI:
            if not request.api_key:
                raise HTTPException(status_code=400, detail="API key is required for OpenAI")
            return connection_service.connect_openai(request.api_key)

        elif request.type == LLMType.LLAMA:
            if not request.host or not request.port:
                raise HTTPException(
                    status_code=400, detail="Host and port are required for Llama.cpp"
                )
            return connection_service.connect_llama(request.host, request.port)

        raise HTTPException(status_code=400, detail="Unsupported LLM type")

    except HTTPException as http_error:
        return LLMConnectionResponse(success=False, message=http_error.detail)
    except Exception as e:
        return LLMConnectionResponse(success=False, message=str(e))


@app.post("/api/submit_action", response_model=ActionResponse)
async def submit_action(
    request: ActionRequest,
    action_service: TextGenerationService = Depends(get_action_service),
) -> ActionResponse:
    """Submit a text action for processing."""
    result = await action_service.generate(request)
    return ActionResponse(**result)


@app.post("/api/submit_eval", response_model=EvalResponse)
async def submit_eval(
    request: EvalRequest,
    eval_service: TextGenerationService = Depends(get_eval_service),
) -> EvalResponse:
    """Submit a text evaluation request."""
    result = await eval_service.generate(request)
    return EvalResponse(**result)


@app.post("/api/chat", response_model=TextResponse)
async def chat(
    request: ChatRequest,
    chat_service: TextGenerationService = Depends(get_chat_service),
) -> TextResponse:
    """Process a chat message and return a response."""
    try:
        result = await chat_service.generate(request)
        return TextResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", response_model=HealthResponse)
async def health_check(
    provider_registry: LLMProviderRegistry = Depends(get_provider_registry),
) -> HealthResponse:
    """Health check endpoint."""
    active_provider = provider_registry.get_active_provider()
    return HealthResponse(
        status="healthy",
        llm_connected=bool(active_provider and active_provider.is_connected),
        llm_type=active_provider.provider_type if active_provider else None,
    )
