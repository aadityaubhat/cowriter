"""
Core settings for the CoWriter Backend
"""

import os
from typing import List, Optional

# API version
API_V1_STR = "/api/v1"

# CORS settings
ALLOWED_ORIGINS: List[str] = [
    # Local development
    "http://localhost:3000",
    # Vercel deployment (update with your actual domain)
    "https://cowriter-app.vercel.app",
    # Add any other domains that need access to the API
]

# Get allowed origins from environment variable if set
allowed_origins_env: Optional[str] = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env is not None:
    ALLOWED_ORIGINS.extend(allowed_origins_env.split(","))
