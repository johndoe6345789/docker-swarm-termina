"""Restart container route."""
from flask import Blueprint, jsonify
from config import logger
from utils.container_helpers import get_auth_and_container

restart_bp = Blueprint('restart_container', __name__)


@restart_bp.route('/api/containers/<container_id>/restart', methods=['POST'])
def restart_container(container_id):
    """Restart a container."""
    container, error_response = get_auth_and_container(container_id)
    if error_response:
        return error_response

    try:
        container.restart()
        logger.info("Restarted container %s", container_id)
        return jsonify({'success': True, 'message': f'Container {container_id} restarted'})
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error restarting container: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
