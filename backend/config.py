"""Application configuration and constants."""
import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Default credentials (should be environment variables in production)
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')

# Simple in-memory session storage (in production, use proper session management)
sessions = {}

# Track working directory per session
session_workdirs = {}

# Active terminal sessions
active_terminals = {}
