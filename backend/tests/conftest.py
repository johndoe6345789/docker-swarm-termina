import pytest
import sys
import os
import socket
import threading
from unittest.mock import Mock, MagicMock

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app as flask_app, socketio


@pytest.fixture
def app():
    """Create application for testing"""
    flask_app.config.update({
        'TESTING': True,
        'WTF_CSRF_ENABLED': False
    })
    yield flask_app


@pytest.fixture
def client(app):
    """Create a test client"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test CLI runner"""
    return app.test_cli_runner()


@pytest.fixture
def mock_docker_client(mocker):
    """Mock Docker client"""
    mock_client = mocker.MagicMock()
    mock_client.ping.return_value = True
    return mock_client


@pytest.fixture
def auth_token(client):
    """Get a valid authentication token"""
    response = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    data = response.get_json()
    return data['token']


@pytest.fixture
def auth_headers(auth_token):
    """Get authentication headers"""
    return {'Authorization': f'Bearer {auth_token}'}


# Docker integration test helpers

def docker_available():
    """Check if Docker is available"""
    try:
        import docker
        client = docker.from_env()
        client.ping()
        return True
    except Exception:
        return False


class SimulatedSocket:
    """Simulated socket that mimics Docker exec socket behavior"""

    def __init__(self):
        self._sock = Mock()
        self._sock.sendall = Mock()
        self._sock.recv = Mock(return_value=b'$ echo test\ntest\n$ ')
        self._sock.close = Mock()
        self.closed = False

    def recv(self, size):
        """Simulate receiving data"""
        if self.closed:
            return b''
        return self._sock.recv(size)

    def close(self):
        """Close the socket"""
        self.closed = True
        self._sock.close()


class SimulatedExecInstance:
    """Simulated Docker exec instance for testing without Docker"""

    def __init__(self):
        self.output = SimulatedSocket()
        self.id = 'simulated_exec_12345'


class SimulatedContainer:
    """Simulated Docker container for testing without Docker"""

    def __init__(self):
        self.id = 'simulated_container_12345'
        self.name = 'test_simulated_container'
        self.status = 'running'

    def exec_run(self, cmd, **kwargs):
        """Simulate exec_run that returns a socket-like object"""
        return SimulatedExecInstance()

    def stop(self, timeout=10):
        """Simulate stopping the container"""
        self.status = 'stopped'

    def remove(self):
        """Simulate removing the container"""
        pass


@pytest.fixture
def simulated_container():
    """Provide a simulated container for testing without Docker"""
    return SimulatedContainer()


@pytest.fixture
def test_container_or_simulated():
    """
    Provide either a real Docker container or simulated one.
    Use real container if Docker is available, otherwise use simulated.
    """
    if docker_available():
        import docker
        import time

        client = docker.from_env()

        # Pull alpine image if not present
        try:
            client.images.get('alpine:latest')
        except docker.errors.ImageNotFound:
            client.images.pull('alpine:latest')

        # Create and start container
        container = client.containers.run(
            'alpine:latest',
            command='sleep 300',
            detach=True,
            remove=True,
            name='pytest_test_container'
        )

        time.sleep(1)

        yield container

        # Cleanup
        try:
            container.stop(timeout=1)
        except:
            pass
    else:
        # Use simulated container
        yield SimulatedContainer()
