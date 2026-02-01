import pytest
from unittest.mock import MagicMock, patch


class TestContainerExec:
    """Test container command execution"""

    def test_exec_unauthorized(self, client):
        """Test exec without auth"""
        response = client.post('/api/containers/abc123/exec', json={
            'command': 'ls'
        })
        assert response.status_code == 401

    @patch('utils.docker_client.get_docker_client')
    def test_exec_simple_command(self, mock_get_client, client, auth_headers, auth_token):
        """Test executing a simple command"""
        # Mock exec result
        mock_exec_result = MagicMock()
        mock_exec_result.output = b'file1.txt\nfile2.txt\n::WORKDIR::/app'
        mock_exec_result.exit_code = 0

        mock_container = MagicMock()
        mock_container.exec_run.return_value = mock_exec_result

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'ls'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['exit_code'] == 0
        assert 'file1.txt' in data['output']
        assert data['workdir'] == '/app'

    @patch('utils.docker_client.get_docker_client')
    def test_exec_cd_command(self, mock_get_client, client, auth_headers, auth_token):
        """Test executing cd command"""
        # Mock exec result for cd command
        mock_exec_result = MagicMock()
        mock_exec_result.output = b'/home/user\n'
        mock_exec_result.exit_code = 0

        mock_container = MagicMock()
        mock_container.exec_run.return_value = mock_exec_result

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'cd /home/user'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['exit_code'] == 0
        assert data['workdir'] == '/home/user'
        assert data['output'] == ''

    @patch('utils.docker_client.get_docker_client')
    def test_exec_command_with_error(self, mock_get_client, client, auth_headers, auth_token):
        """Test executing a command that fails"""
        # Mock exec result with error
        mock_exec_result = MagicMock()
        mock_exec_result.output = b'command not found::WORKDIR::/app'
        mock_exec_result.exit_code = 127

        mock_container = MagicMock()
        mock_container.exec_run.return_value = mock_exec_result

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'invalidcommand'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['exit_code'] == 127
        assert 'command not found' in data['output']

    @patch('utils.docker_client.get_docker_client')
    def test_exec_docker_unavailable(self, mock_get_client, client, auth_headers):
        """Test exec when Docker is unavailable"""
        mock_get_client.return_value = None

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'ls'})

        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data

    @patch('utils.docker_client.get_docker_client')
    def test_exec_unicode_handling(self, mock_get_client, client, auth_headers, auth_token):
        """Test exec with unicode output"""
        # Mock exec result with unicode
        mock_exec_result = MagicMock()
        mock_exec_result.output = 'Hello 世界\n::WORKDIR::/app'.encode('utf-8')
        mock_exec_result.exit_code = 0

        mock_container = MagicMock()
        mock_container.exec_run.return_value = mock_exec_result

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'echo "Hello 世界"'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['exit_code'] == 0
        assert '世界' in data['output']
