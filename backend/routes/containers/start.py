"""Start container route."""
from flask import Blueprint, jsonify
from config import logger
from utils.auth import check_auth
from utils.docker_client import get_docker_client

start_bp = Blueprint('start_container', __name__)


@start_bp.route('/api/containers/<container_id>/start', methods=['POST'])
def start_container(container_id):
    """Start a stopped container."""
    is_valid, _, error_response = check_auth()
    if not is_valid:
        return error_response

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)
        container.start()
        logger.info("Started container %s", container_id)
        return jsonify({'success': True, 'message': f'Container {container_id} started'})
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error starting container: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
