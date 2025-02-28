from typing import Optional

import openai
import requests
from openai.types.chat import ChatCompletion

from app.models.llm import LLMType


class LLMConnectionManager:
    def __init__(self) -> None:
        self.llm_type: Optional[LLMType] = None
        self.api_key: Optional[str] = None
        self.host: Optional[str] = None
        self.port: Optional[str] = None
        self.is_connected: bool = False

    def connect_openai(self, api_key: str) -> None:
        openai.api_key = api_key
        # Test the connection
        try:
            openai.models.list()
            self.llm_type = LLMType.OPENAI
            self.api_key = api_key
            self.is_connected = True
        except Exception as e:
            raise Exception(f"Failed to connect to OpenAI: {str(e)}")

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
                raise Exception(f"Llama.cpp server returned status code: {response.status_code}")
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

    def _generate_openai_text(self, prompt: str) -> str:
        """Handle OpenAI text generation."""
        try:
            response: ChatCompletion = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
            )
            return str(response.choices[0].message.content)
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    def _generate_llama_text(self, prompt: str) -> str:
        """Handle Llama text generation."""
        try:
            url = f"{self.host}:{self.port}/v1/chat/completions"
            print(f"Sending request to Llama.cpp at: {url}")

            payload = {
                "model": "Llama-3.2-3B-Instruct",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful writing assistant. You take the user's prompt and return a modified text according to the user's preferences.",
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
                    return str(data["choices"][0]["message"]["content"])
                raise Exception("Invalid response format from Llama.cpp")

            error_msg = f"Llama.cpp server error: {response.status_code} - {response.text}"
            raise Exception(error_msg)

        except requests.exceptions.RequestException as e:
            print(f"Llama.cpp request error: {str(e)}")
            raise Exception(f"Llama.cpp request error: {str(e)}")
        except Exception as e:
            print(f"Unexpected error with Llama.cpp: {str(e)}")
            raise

    async def generate_text(self, prompt: str) -> str:
        """Generate text using the configured LLM."""
        if not self.is_connected:
            raise Exception("No active LLM connection")

        if self.llm_type == LLMType.OPENAI:
            return self._generate_openai_text(prompt)
        elif self.llm_type == LLMType.LLAMA:
            return self._generate_llama_text(prompt)

        raise Exception("Unknown LLM type")


# Create a singleton instance
llm_manager = LLMConnectionManager()
