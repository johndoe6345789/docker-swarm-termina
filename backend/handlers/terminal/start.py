"""Terminal WebSocket start handler."""
from flask import request
from flask_socketio import emit, disconnect
from config import logger, sessions, active_terminals
from utils.docker_client import get_docker_client
from utils.terminal_helpers import create_output_reader


def handle_start_terminal(socketio, data):
    """Start an interactive terminal session.

    Args:
        socketio: SocketIO instance
        data: Request data containing container_id, token, cols, rows
    """
    try:
        container_id = data.get('container_id')
        token = data.get('token')
        cols = data.get('cols', 80)
        rows = data.get('rows', 24)

        # Validate token
        if not token or token not in sessions:
            emit('error', {'error': 'Unauthorized'})
            disconnect()
            return

        # Get Docker client and container
        client = get_docker_client()
        if not client:
            emit('error', {'error': 'Cannot connect to Docker'})
            return

        container = client.containers.get(container_id)

        # Create an interactive bash session with PTY
        exec_instance = container.exec_run(
            ['/bin/bash'],
            stdin=True,
            stdout=True,
            stderr=True,
            tty=True,
            socket=True,
            environment={
                'TERM': 'xterm-256color',
                'COLUMNS': str(cols),
                'LINES': str(rows),
                'LANG': 'C.UTF-8'
            }
        )

        # Store the exec instance
        active_terminals[request.sid] = {
            'exec': exec_instance,
            'container_id': container_id
        }

        # Start output reader thread
        create_output_reader(socketio, request.sid, exec_instance)

        emit('started', {'message': 'Terminal started'})

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error starting terminal: %s", e, exc_info=True)
        emit('error', {'error': str(e)})
