"""Terminal WebSocket connect handler."""
from flask import request
from config import logger


def handle_connect():
    """Handle WebSocket connection."""
    logger.info("Client connected to terminal WebSocket: %s", request.sid)
