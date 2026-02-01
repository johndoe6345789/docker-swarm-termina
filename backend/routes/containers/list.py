"""List containers route."""
from flask import Blueprint, jsonify
from utils.auth import check_auth
from utils.docker_client import get_docker_client
from utils.formatters import format_uptime

list_bp = Blueprint('list_containers', __name__)


@list_bp.route('/api/containers', methods=['GET'])
def get_containers():
    """Get list of all containers."""
    is_valid, _, error_response = check_auth()
    if not is_valid:
        return error_response

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        containers = client.containers.list(all=True)
        container_list = []

        for container in containers:
            container_list.append({
                'id': container.short_id,
                'name': container.name,
                'image': container.image.tags[0] if container.image.tags else 'unknown',
                'status': container.status,
                'uptime': format_uptime(container.attrs['Created'])
                if container.status == 'running' else 'N/A'
            })

        return jsonify({'containers': container_list})
    except Exception as e:  # pylint: disable=broad-exception-caught
        return jsonify({'error': str(e)}), 500
