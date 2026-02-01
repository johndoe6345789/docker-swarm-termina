"""Stop container route."""
from flask import Blueprint, jsonify
from config import logger
from utils.auth import check_auth
from utils.docker_client import get_docker_client

stop_bp = Blueprint('stop_container', __name__)


@stop_bp.route('/api/containers/<container_id>/stop', methods=['POST'])
def stop_container(container_id):
    """Stop a running container."""
    is_valid, _, error_response = check_auth()
    if not is_valid:
        return error_response

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)
        container.stop()
        logger.info("Stopped container %s", container_id)
        return jsonify({'success': True, 'message': f'Container {container_id} stopped'})
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error stopping container: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
