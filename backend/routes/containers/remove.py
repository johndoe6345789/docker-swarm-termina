"""Remove container route."""
from flask import Blueprint, jsonify
from config import logger
from utils.auth import check_auth
from utils.docker_client import get_docker_client

remove_bp = Blueprint('remove_container', __name__)


@remove_bp.route('/api/containers/<container_id>', methods=['DELETE'])
def remove_container(container_id):
    """Remove a container."""
    is_valid, _, error_response = check_auth()
    if not is_valid:
        return error_response

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)
        container.remove(force=True)
        logger.info("Removed container %s", container_id)
        return jsonify({'success': True, 'message': f'Container {container_id} removed'})
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error removing container: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
