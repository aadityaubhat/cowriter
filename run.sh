#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i:"$1" >/dev/null 2>&1
}

# Function to stop background processes on script exit
cleanup() {
    echo "Stopping services..."
    # Stop and remove Docker containers using docker-compose
    docker compose down
    # Kill any background jobs (like the npm frontend process)
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }

# Check if ports are available
if port_in_use 8000; then
    echo "Error: Port 8000 is already in use"
    exit 1
fi

if port_in_use 3000; then
    echo "Error: Port 3000 is already in use"
    exit 1
fi

if port_in_use 5432; then
    echo "Error: Port 5432 is already in use"
    exit 1
fi

echo "Starting CoWriter services..."

# Start backend and database services using docker-compose
echo "Starting backend and database services..."
docker compose up -d

# Wait for backend to be ready
echo "Waiting for backend to start..."
timeout=60
while ! curl -s http://localhost:8000/health > /dev/null; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "Timeout waiting for backend"
        exit 1
    fi
    sleep 1
done

# Start frontend service
echo "Starting frontend service..."
cd cowriter
npm install --omit=dev  # Install only production dependencies
npm run dev &
frontend_pid=$!
cd ..

echo "Services are starting up:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8000"
echo "- API docs: http://localhost:8000/docs"
echo "- PostgreSQL: localhost:5432"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for either service to exit
wait $frontend_pid
echo "A service has stopped unexpectedly"
exit 1 