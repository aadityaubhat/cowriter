"""
Test script for database connectivity and initialization.
"""

import asyncio
import logging

from app.db.init_db import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def test_database():
    """Test database connectivity and initialization."""
    try:
        logger.info("Testing database initialization...")
        await init_db()
        logger.info("Database initialization successful!")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    logger.info("Starting database test...")
    asyncio.run(test_database())
    logger.info("Database test completed.")
