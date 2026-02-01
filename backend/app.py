"""Main application entry point - refactored modular architecture."""
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from config import logger
from routes.login import login_bp
from routes.logout import logout_bp
from routes.health import health_bp
from routes.containers.list import list_bp
from routes.containers.exec import exec_bp
from routes.containers.start import start_bp
from routes.containers.stop import stop_bp
from routes.containers.restart import restart_bp
from routes.containers.remove import remove_bp
from handlers.terminal.register import register_terminal_handlers
from utils.diagnostics.docker_env import diagnose_docker_environment
from utils.docker_client import get_docker_client

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO
# Note: Frontend uses polling-only transport due to Cloudflare/reverse proxy
# blocking WebSocket connections. Server supports both transports.
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
app.register_blueprint(login_bp)
app.register_blueprint(logout_bp)
app.register_blueprint(health_bp)
app.register_blueprint(list_bp)
app.register_blueprint(exec_bp)
app.register_blueprint(start_bp)
app.register_blueprint(stop_bp)
app.register_blueprint(restart_bp)
app.register_blueprint(remove_bp)

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

        # Check Docker Swarm status
        from utils.diagnostics.docker_env import check_swarm_status
        swarm_ok = check_swarm_status(test_client)
        if swarm_ok:
            logger.info("✓ Docker Swarm verification passed")
        else:
            logger.warning("⚠ Docker Swarm verification did not pass (this is OK for local development)")
    else:
        logger.error("✗ Docker connection FAILED on startup - check logs above for details")

    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
