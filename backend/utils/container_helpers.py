"""Common helpers for container routes."""
from flask import jsonify
from utils.auth import check_auth
from utils.docker_client import get_docker_client


def get_auth_and_container(container_id):
    """Common auth check and container retrieval pattern.

    Args:
        container_id: Container ID to retrieve

    Returns:
        tuple: (container, error_response) where error_response is None on success
    """
    # Check authentication
    is_valid, _, error_response = check_auth()
    if not is_valid:
        return None, error_response

    # Get Docker client
    client = get_docker_client()
    if not client:
        return None, (jsonify({'error': 'Cannot connect to Docker'}), 500)

    # Get container
    try:
        container = client.containers.get(container_id)
        return container, None
    except Exception as e:  # pylint: disable=broad-exception-caught
        return None, (jsonify({'error': str(e)}), 500)
