"""Start container route."""
from flask import Blueprint, jsonify
from config import logger
from utils.container_helpers import get_auth_and_container

start_bp = Blueprint('start_container', __name__)


@start_bp.route('/api/containers/<container_id>/start', methods=['POST'])
def start_container(container_id):
    """Start a stopped container."""
    container, error_response = get_auth_and_container(container_id)
    if error_response:
        return error_response

    try:
        container.start()
        logger.info("Started container %s", container_id)
        return jsonify({'success': True, 'message': f'Container {container_id} started'})
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error starting container: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
