"""Logout route."""
from flask import Blueprint, request, jsonify
from config import sessions

logout_bp = Blueprint('logout', __name__)


@logout_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user."""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        if token in sessions:
            del sessions[token]

    return jsonify({'success': True})
