"""Terminal WebSocket input handler."""
from flask import request
from flask_socketio import emit
from config import logger, active_terminals


def handle_input(data):
    """Handle input from the client.

    Args:
        data: Input data containing the user's input string
    """
    try:
        if request.sid not in active_terminals:
            emit('error', {'error': 'No active terminal session'})
            return

        terminal_data = active_terminals[request.sid]
        exec_instance = terminal_data['exec']
        input_data = data.get('data', '')

        # Send input to the container
        sock = exec_instance.output
        # Access the underlying socket for sendall method
        if hasattr(sock, '_sock'):
            sock._sock.sendall(input_data.encode('utf-8'))  # pylint: disable=protected-access
        else:
            sock.sendall(input_data.encode('utf-8'))

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error sending input: %s", e, exc_info=True)
        emit('error', {'error': str(e)})
