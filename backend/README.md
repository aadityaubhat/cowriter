# CoWriter Backend

This is the backend service for the CoWriter application, built with FastAPI and Python.

## Setup

1. Make sure you have Python 3.9+ and Poetry installed
2. Install dependencies:
   ```bash
   poetry install
   ```

## Running the Server

1. Run the server
   ```bash
   poetry run uvicorn app.main:app --reload --port 8000
   ```

The server will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Swagger UI documentation at `http://localhost:8000/docs`
- ReDoc documentation at `http://localhost:8000/redoc`

## Available Endpoints

- `POST /api/submit_action`: Submit text for processing with a specific action
  - Actions: expand, shorten, critique
  - Request body: `{ "action": string, "text": string }`

- `POST /api/chat`: Send a chat message
  - Request body: `{ "message": string, "context": string? }`

- `GET /health`: Health check endpoint 