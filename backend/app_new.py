"""Main application entry point."""
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from config import logger
from routes.auth import auth_bp
from routes.containers import containers_bp
from routes.health import health_bp
from handlers.terminal import register_terminal_handlers
from utils.docker_client import diagnose_docker_environment, get_docker_client

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True
)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(containers_bp)
app.register_blueprint(health_bp)

# Register WebSocket handlers
register_terminal_handlers(socketio)


if __name__ == '__main__':
    # Run diagnostics on startup
    logger.info("Backend server starting...")
    diagnose_docker_environment()

    # Try to get Docker client and log result
    test_client = get_docker_client()
    if test_client:
        logger.info("✓ Docker connection verified on startup")
    else:
        logger.error("✗ Docker connection FAILED on startup - check logs above for details")

    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
