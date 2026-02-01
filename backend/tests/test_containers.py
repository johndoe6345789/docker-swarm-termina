import pytest
from unittest.mock import MagicMock, patch


class TestContainerEndpoints:
    """Test container management endpoints"""

    def test_get_containers_unauthorized(self, client):
        """Test getting containers without auth"""
        response = client.get('/api/containers')
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data

    def test_get_containers_invalid_token(self, client):
        """Test getting containers with invalid token"""
        response = client.get('/api/containers', headers={
            'Authorization': 'Bearer invalid_token'
        })
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data

    @patch('routes.containers.list.get_docker_client')
    def test_get_containers_success(self, mock_get_client, client, auth_headers):
        """Test getting containers successfully"""
        # Mock Docker client
        mock_container = MagicMock()
        mock_container.short_id = 'abc123'
        mock_container.name = 'test-container'
        mock_container.status = 'running'
        mock_container.image.tags = ['nginx:latest']
        mock_container.attrs = {'Created': '2024-01-01T00:00:00.000000000Z'}

        mock_client = MagicMock()
        mock_client.containers.list.return_value = [mock_container]
        mock_get_client.return_value = mock_client

        response = client.get('/api/containers', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'containers' in data
        assert len(data['containers']) == 1
        assert data['containers'][0]['id'] == 'abc123'
        assert data['containers'][0]['name'] == 'test-container'

    @patch('routes.containers.list.get_docker_client')
    def test_get_containers_docker_unavailable(self, mock_get_client, client, auth_headers):
        """Test getting containers when Docker is unavailable"""
        mock_get_client.return_value = None

        response = client.get('/api/containers', headers=auth_headers)
        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data

    @patch('utils.container_helpers.get_docker_client')
    def test_start_container_success(self, mock_get_client, client, auth_headers):
        """Test starting a container"""
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/start', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        mock_container.start.assert_called_once()

    @patch('utils.container_helpers.get_docker_client')
    def test_stop_container_success(self, mock_get_client, client, auth_headers):
        """Test stopping a container"""
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/stop', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        mock_container.stop.assert_called_once()

    @patch('utils.container_helpers.get_docker_client')
    def test_restart_container_success(self, mock_get_client, client, auth_headers):
        """Test restarting a container"""
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/restart', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        mock_container.restart.assert_called_once()

    @patch('utils.container_helpers.get_docker_client')
    def test_remove_container_success(self, mock_get_client, client, auth_headers):
        """Test removing a container"""
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.delete('/api/containers/abc123', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        mock_container.remove.assert_called_once_with(force=True)

    def test_container_operations_unauthorized(self, client):
        """Test container operations without auth"""
        endpoints = [
            ('/api/containers/abc123/start', 'post'),
            ('/api/containers/abc123/stop', 'post'),
            ('/api/containers/abc123/restart', 'post'),
            ('/api/containers/abc123', 'delete'),
        ]

        for endpoint, method in endpoints:
            response = getattr(client, method)(endpoint)
            assert response.status_code == 401
