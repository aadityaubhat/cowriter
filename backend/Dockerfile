# Use official Python image from library
FROM python:3.9-slim

# Prevent Python from writing .pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1
# Prevent Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y curl build-essential && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Poetry
RUN pip install --upgrade pip \
    && pip install poetry

# Copy poetry configuration files
COPY pyproject.toml poetry.lock* /app/

# Configure Poetry to not create virtual environments
ENV POETRY_VIRTUALENVS_CREATE=false

# Install project dependencies using Poetry
RUN poetry install --no-interaction --no-ansi --no-root

# Copy project files
COPY . .

# Expose port 8000 for the FastAPI app
EXPOSE 8000

# Run FastAPI application using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
