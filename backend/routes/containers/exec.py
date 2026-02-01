"""Execute command in container route."""
from flask import Blueprint, request, jsonify
from config import logger, session_workdirs
from utils.auth import check_auth
from utils.docker_client import get_docker_client
from utils.exec_helpers import (
    get_session_workdir,
    execute_command_with_fallback,
    decode_output,
    extract_workdir
)

exec_bp = Blueprint('exec_container', __name__)


@exec_bp.route('/api/containers/<container_id>/exec', methods=['POST'])
def exec_container(container_id):
    """Execute command in container."""
    is_valid, token, error_response = check_auth()
    if not is_valid:
        return error_response

    data = request.get_json()
    user_command = data.get('command', 'echo "No command provided"')

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        # Get session working directory
        session_key, current_workdir = get_session_workdir(token, container_id, session_workdirs)

        # Execute command with bash/sh fallback
        exec_instance = execute_command_with_fallback(
            client.containers.get(container_id),
            current_workdir,
            user_command,
            user_command.strip().startswith('cd ')
        )

        # Decode and extract workdir from output
        output, new_workdir = extract_workdir(
            decode_output(exec_instance),
            current_workdir,
            user_command.strip().startswith('cd ')
        )

        # Update session workdir
        session_workdirs[session_key] = new_workdir

        return jsonify({
            'output': output,
            'exit_code': exec_instance.exit_code,
            'workdir': new_workdir
        })
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error executing command: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
