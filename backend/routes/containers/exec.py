"""Execute command in container route."""
from flask import Blueprint, request, jsonify
from config import logger, session_workdirs
from utils.auth import check_auth
from utils.docker_client import get_docker_client
from utils.exec_helpers import (
    build_bash_command,
    build_sh_command,
    execute_in_container,
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
        container = client.containers.get(container_id)

        # Get or initialize session working directory
        session_key = f"{token}_{container_id}"
        if session_key not in session_workdirs:
            session_workdirs[session_key] = '/'

        current_workdir = session_workdirs[session_key]
        is_cd_command = user_command.strip().startswith('cd ')

        # Try bash first, fallback to sh if bash doesn't exist
        try:
            bash_command = build_bash_command(current_workdir, user_command, is_cd_command)
            exec_instance = execute_in_container(container, bash_command)
        except Exception as bash_error:  # pylint: disable=broad-exception-caught
            logger.warning("Bash execution failed, trying sh: %s", bash_error)
            sh_command = build_sh_command(current_workdir, user_command, is_cd_command)
            exec_instance = execute_in_container(container, sh_command)

        # Decode and extract workdir from output
        output = decode_output(exec_instance)
        output, new_workdir = extract_workdir(output, current_workdir, is_cd_command)

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
