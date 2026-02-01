"""Stop container route."""
from flask import Blueprint, jsonify
from config import logger
from utils.container_helpers import get_auth_and_container

stop_bp = Blueprint('stop_container', __name__)


@stop_bp.route('/api/containers/<container_id>/stop', methods=['POST'])
def stop_container(container_id):
    """Stop a running container."""
    container, error_response = get_auth_and_container(container_id)
    if error_response:
        return error_response

    try:
        container.stop()
        logger.info("Stopped container %s", container_id)
        return jsonify({'success': True, 'message': f'Container {container_id} stopped'})
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error stopping container: %s", e, exc_info=True)
        return jsonify({'error': str(e)}), 500
