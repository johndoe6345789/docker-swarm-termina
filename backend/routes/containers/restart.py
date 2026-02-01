"""Restart container route."""
from flask import Blueprint, jsonify
from config import logger
from utils.auth import check_auth
from utils.docker_client import get_docker_client

restart_bp = Blueprint('restart_container', __name__)


@restart_bp.route('/api/containers/<container_id>/restart', methods=['POST'])
def restart_container(container_id):
    """Restart a container."""
    is_valid, _, error_response = check_auth()
    if not is_valid:
        return error_response

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)
        container.restart()
        logger.info("Restarted container %s", container_id)
        return jsonify({'success': True, 'message': f'Container {container_id} restarted'})
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error restarting container: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
