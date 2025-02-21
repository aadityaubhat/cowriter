#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to stop background processes on script exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Check for required commands
if ! command_exists node; then
    echo "Error: Node.js is not installed"
    exit 1
fi

if ! command_exists python3; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

if ! command_exists poetry; then
    echo "Error: Poetry is not installed"
    exit 1
fi

echo "Starting CoWriter services..."

# Start backend service
echo "Starting backend service..."
cd backend
poetry install
poetry run uvicorn app.main:app --reload --port 8000 &
cd ..

# Wait a bit for backend to initialize
sleep 2

# Start frontend service
echo "Starting frontend service..."
cd co_writer
npm install
npm run dev &
cd ..

echo "Services are starting up:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8000"
echo "- API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait 