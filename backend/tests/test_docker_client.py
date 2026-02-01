import pytest
from unittest.mock import MagicMock, patch
import docker


class TestDockerClient:
    """Test Docker client connection logic"""

    @patch('docker.from_env')
    def test_get_docker_client_success(self, mock_from_env):
        """Test successful Docker client connection"""
        from utils.docker_client import get_docker_client

        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_from_env.return_value = mock_client

        client = get_docker_client()
        assert client is not None
        mock_client.ping.assert_called_once()

    @patch('docker.DockerClient')
    @patch('docker.from_env')
    def test_get_docker_client_fallback_to_socket(self, mock_from_env, mock_docker_client):
        """Test fallback to Unix socket when from_env fails"""
        from utils.docker_client import get_docker_client

        # Make from_env fail
        mock_from_env.side_effect = Exception("Connection failed")

        # Make socket connection succeed
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_docker_client.return_value = mock_client

        client = get_docker_client()
        assert client is not None
        mock_docker_client.assert_called_with(base_url='unix:///var/run/docker.sock')

    @patch('docker.DockerClient')
    @patch('docker.from_env')
    def test_get_docker_client_all_methods_fail(self, mock_from_env, mock_docker_client):
        """Test when all Docker connection methods fail"""
        from utils.docker_client import get_docker_client

        # Make both methods fail
        mock_from_env.side_effect = Exception("from_env failed")
        mock_docker_client.side_effect = Exception("socket failed")

        client = get_docker_client()
        assert client is None


class TestFormatUptime:
    """Test uptime formatting edge cases"""

    def test_format_uptime_zero_minutes(self):
        """Test formatting for containers just started"""
        from utils.formatters import format_uptime
        from datetime import datetime, timezone, timedelta

        now = datetime.now(timezone.utc)
        created_at = now - timedelta(seconds=30)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        # Should show 0m
        assert 'm' in result

    def test_format_uptime_exactly_one_day(self):
        """Test formatting for exactly 1 day"""
        from utils.formatters import format_uptime
        from datetime import datetime, timezone, timedelta

        now = datetime.now(timezone.utc)
        created_at = now - timedelta(days=1)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        assert '1d' in result

    def test_format_uptime_many_days(self):
        """Test formatting for many days"""
        from utils.formatters import format_uptime
        from datetime import datetime, timezone, timedelta

        now = datetime.now(timezone.utc)
        created_at = now - timedelta(days=30, hours=5)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        assert 'd' in result
        assert 'h' in result
