"""Terminal WebSocket resize handler."""
from flask import request
from config import logger, active_terminals


def handle_resize(data):
    """Handle terminal resize.

    Args:
        data: Resize data containing cols and rows

    Note:
        Docker exec_run doesn't support resizing after creation.
        This is a limitation of the Docker API.
    """
    try:
        cols = data.get('cols', 80)
        rows = data.get('rows', 24)

        if request.sid in active_terminals:
            logger.info("Terminal resize requested: %sx%s", cols, rows)

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error resizing terminal: %s", e, exc_info=True)
