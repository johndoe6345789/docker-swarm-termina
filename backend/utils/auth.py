"""Authentication utilities."""
from flask import request, jsonify
from config import sessions


def check_auth():
    """Check if request has valid authentication.

    Returns:
        tuple: (is_valid, token, error_response)
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False, None, (jsonify({'error': 'Unauthorized'}), 401)

    token = auth_header.split(' ')[1]
    if token not in sessions:
        return False, None, (jsonify({'error': 'Invalid session'}), 401)

    return True, token, None
