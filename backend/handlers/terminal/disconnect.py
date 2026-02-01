"""Terminal WebSocket disconnect handler."""
from flask import request
from config import logger, active_terminals


def handle_disconnect():
    """Handle WebSocket disconnection."""
    logger.info("Client disconnected from terminal WebSocket: %s", request.sid)
    # Clean up any active terminal sessions
    if request.sid in active_terminals:
        try:
            exec_instance = active_terminals[request.sid]['exec']
            if hasattr(exec_instance, 'kill'):
                exec_instance.kill()
        except Exception:  # pylint: disable=broad-exception-caught
            pass
        del active_terminals[request.sid]
