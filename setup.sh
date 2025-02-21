#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required package managers
echo "Checking prerequisites..."

if ! command_exists node; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

if ! command_exists python3; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.9+ from https://python.org"
    exit 1
fi

if ! command_exists poetry; then
    echo "Error: Poetry is not installed"
    echo "Please install Poetry using instructions from https://python-poetry.org/docs/#installation"
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
poetry install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd co_writer
npm install
cd ..

# Create example environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating example backend environment file..."
    echo "# Backend Environment Variables
OPENAI_API_KEY=your_api_key_here
MODEL_NAME=gpt-4-turbo-preview
DEBUG=False
ALLOWED_ORIGINS=http://localhost:3000  # Comma-separated list of allowed origins" > backend/.env
    echo "Please update backend/.env with your actual configuration"
fi

if [ ! -f "co_writer/.env.local" ]; then
    echo "Creating example frontend environment file..."
    echo "# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000" > co_writer/.env.local
fi

echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your OpenAI API key"
echo "2. Run './run.sh' to start the services" 