import pytest
import sys
import os

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
