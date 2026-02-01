"""Login route."""
from datetime import datetime
from flask import Blueprint, request, jsonify
from config import ADMIN_USERNAME, ADMIN_PASSWORD, sessions

login_bp = Blueprint('login', __name__)


@login_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user."""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session_token = f"session_{username}_{datetime.now().timestamp()}"
        sessions[session_token] = {
            'username': username,
            'created_at': datetime.now()
        }
        return jsonify({
            'success': True,
            'token': session_token,
            'username': username
        })

    return jsonify({
        'success': False,
        'message': 'Invalid credentials'
    }), 401
