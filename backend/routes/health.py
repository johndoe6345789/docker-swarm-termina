"""Health check route."""
from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)


@health_bp.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'})
