"""Tests to boost coverage to 100%."""
import pytest
from unittest.mock import MagicMock, patch, Mock
from flask import jsonify


class TestContainerExceptionHandling:
    """Test exception handling in container routes"""

    @patch('utils.container_helpers.get_docker_client')
    def test_start_container_exception(self, mock_get_client, client, auth_headers):
        """Test start container with exception"""
        mock_container = MagicMock()
        mock_container.start.side_effect = Exception("Container failed to start")

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/test123/start', headers=auth_headers)
        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data

    @patch('utils.container_helpers.get_docker_client')
    def test_stop_container_exception(self, mock_get_client, client, auth_headers):
        """Test stop container with exception"""
        mock_container = MagicMock()
        mock_container.stop.side_effect = Exception("Container failed to stop")

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/test123/stop', headers=auth_headers)
        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data

    @patch('utils.container_helpers.get_docker_client')
    def test_restart_container_exception(self, mock_get_client, client, auth_headers):
        """Test restart container with exception"""
        mock_container = MagicMock()
        mock_container.restart.side_effect = Exception("Container failed to restart")

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/test123/restart', headers=auth_headers)
        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data

    @patch('utils.container_helpers.get_docker_client')
    def test_remove_container_exception(self, mock_get_client, client, auth_headers):
        """Test remove container with exception"""
        mock_container = MagicMock()
        mock_container.remove.side_effect = Exception("Container failed to remove")

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.delete('/api/containers/test123', headers=auth_headers)
        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data

    @patch('routes.containers.list.get_docker_client')
    def test_list_containers_exception(self, mock_get_client, client, auth_headers):
        """Test list containers with exception"""
        mock_client = MagicMock()
        mock_client.containers.list.side_effect = Exception("Failed to list containers")
        mock_get_client.return_value = mock_client

        response = client.get('/api/containers', headers=auth_headers)
        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data


class TestContainerHelpers:
    """Test container_helpers exception handling"""

    @patch('utils.container_helpers.get_docker_client')
    def test_get_auth_and_container_exception(self, mock_get_client):
        """Test get_auth_and_container when container.get raises exception"""
        from utils.container_helpers import get_auth_and_container
        from config import sessions

        # Create a valid session
        token = 'test_token_123'
        sessions[token] = {'username': 'test'}

        # Mock client that raises exception
        mock_client = MagicMock()
        mock_client.containers.get.side_effect = Exception("Container not found")
        mock_get_client.return_value = mock_client

        # This test needs to be called in request context
        from flask import Flask
        app = Flask(__name__)

        with app.test_request_context(headers={'Authorization': f'Bearer {token}'}):
            container, error = get_auth_and_container('test123')
            assert container is None
            assert error is not None
            assert error[1] == 500


class TestExecHelpers:
    """Test exec_helpers edge cases"""

    def test_decode_output_unicode_error(self):
        """Test decode_output with invalid UTF-8"""
        from utils.exec_helpers import decode_output

        mock_exec = MagicMock()
        # Invalid UTF-8 sequence
        mock_exec.output = b'\x80\x81\x82\x83'

        result = decode_output(mock_exec)
        # Should fallback to latin-1
        assert result is not None
        assert isinstance(result, str)

    def test_extract_workdir_no_marker(self):
        """Test extract_workdir when no marker present"""
        from utils.exec_helpers import extract_workdir

        output = "some command output"
        current_workdir = "/test"
        result_output, result_workdir = extract_workdir(output, current_workdir, False)

        assert result_output == output
        assert result_workdir == current_workdir

    def test_execute_command_bash_fallback(self):
        """Test execute_command_with_fallback when bash fails"""
        from utils.exec_helpers import execute_command_with_fallback

        mock_container = MagicMock()
        # Make bash fail, sh succeed
        mock_container.exec_run.side_effect = [
            Exception("bash not found"),
            MagicMock(output=b'success', exit_code=0)
        ]

        result = execute_command_with_fallback(
            mock_container, '/app', 'ls', False
        )
        assert result.exit_code == 0
        assert mock_container.exec_run.call_count == 2


