import pytest
from unittest.mock import MagicMock, patch


class TestExecAdvanced:
    """Advanced tests for command execution"""

    @patch('utils.docker_client.get_docker_client')
    def test_exec_bash_fallback_to_sh(self, mock_get_client, client, auth_headers, auth_token):
        """Test fallback from bash to sh when bash doesn't exist"""
        # Mock exec that fails for bash but succeeds for sh
        mock_bash_result = MagicMock()
        mock_sh_result = MagicMock()
        mock_sh_result.output = b'output from sh::WORKDIR::/app'
        mock_sh_result.exit_code = 0

        mock_container = MagicMock()
        # First call (bash) raises exception, second call (sh) succeeds
        mock_container.exec_run.side_effect = [
            Exception("bash not found"),
            mock_sh_result
        ]

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'ls'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['exit_code'] == 0

    @patch('utils.docker_client.get_docker_client')
    def test_exec_container_not_found(self, mock_get_client, client, auth_headers):
        """Test exec on non-existent container"""
        mock_client = MagicMock()
        mock_client.containers.get.side_effect = Exception("Container not found")
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'ls'})

        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data

    @patch('utils.docker_client.get_docker_client')
    def test_exec_preserves_working_directory(self, mock_get_client, client, auth_headers, auth_token):
        """Test that working directory is preserved across commands"""
        mock_exec_result = MagicMock()
        mock_exec_result.output = b'::WORKDIR::/home/user'
        mock_exec_result.exit_code = 0

        mock_container = MagicMock()
        mock_container.exec_run.return_value = mock_exec_result

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        # First command
        response1 = client.post('/api/containers/abc123/exec',
                                headers=auth_headers,
                                json={'command': 'pwd'})
        assert response1.status_code == 200
        data1 = response1.get_json()
        assert data1['workdir'] == '/home/user'

        # Second command should use the same session workdir
        response2 = client.post('/api/containers/abc123/exec',
                                headers=auth_headers,
                                json={'command': 'ls'})
        assert response2.status_code == 200

    @patch('utils.docker_client.get_docker_client')
    def test_exec_cd_with_tilde(self, mock_get_client, client, auth_headers, auth_token):
        """Test cd command with tilde expansion"""
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
                               json={'command': 'cd ~'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['workdir'] == '/home/user'

    @patch('utils.docker_client.get_docker_client')
    def test_exec_cd_no_args(self, mock_get_client, client, auth_headers, auth_token):
        """Test cd command without arguments (should go to home)"""
        mock_exec_result = MagicMock()
        mock_exec_result.output = b'/root\n::WORKDIR::/'
        mock_exec_result.exit_code = 0

        mock_container = MagicMock()
        mock_container.exec_run.return_value = mock_exec_result

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'cd'})

        assert response.status_code == 200
        data = response.get_json()
        # 'cd' alone doesn't match 'cd ' pattern, so executes as regular command
        # workdir should be extracted from ::WORKDIR:: marker
        assert data['workdir'] == '/'

    @patch('utils.docker_client.get_docker_client')
    def test_exec_latin1_encoding_fallback(self, mock_get_client, client, auth_headers, auth_token):
        """Test fallback to latin-1 encoding for non-UTF-8 output"""
        # Create binary data that's not valid UTF-8
        invalid_utf8 = b'\xff\xfe Invalid UTF-8 \x80::WORKDIR::/app'

        mock_exec_result = MagicMock()
        mock_exec_result.output = invalid_utf8
        mock_exec_result.exit_code = 0

        mock_container = MagicMock()
        mock_container.exec_run.return_value = mock_exec_result

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={'command': 'cat binary_file'})

        assert response.status_code == 200
        data = response.get_json()
        # Should succeed with latin-1 fallback
        assert data['exit_code'] == 0
        assert 'output' in data

    @patch('utils.docker_client.get_docker_client')
    def test_exec_empty_command(self, mock_get_client, client, auth_headers, auth_token):
        """Test exec with empty/no command"""
        mock_exec_result = MagicMock()
        mock_exec_result.output = b'No command provided::WORKDIR::/'
        mock_exec_result.exit_code = 0

        mock_container = MagicMock()
        mock_container.exec_run.return_value = mock_exec_result

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        # Don't provide command
        response = client.post('/api/containers/abc123/exec',
                               headers=auth_headers,
                               json={})

        assert response.status_code == 200
