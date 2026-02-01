"""Remove container route."""
from flask import Blueprint, jsonify
from config import logger
from utils.container_helpers import get_auth_and_container

remove_bp = Blueprint('remove_container', __name__)


@remove_bp.route('/api/containers/<container_id>', methods=['DELETE'])
def remove_container(container_id):
    """Remove a container."""
    container, error_response = get_auth_and_container(container_id)
    if error_response:
        return error_response

    try:
        container.remove(force=True)
        logger.info("Removed container %s", container_id)
        return jsonify({'success': True, 'message': f'Container {container_id} removed'})
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error removing container: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
