"""Tests for Docker Swarm status checks."""
import pytest
from unittest.mock import MagicMock, Mock, patch


class TestSwarmStatusChecks:
    """Test Docker Swarm status check functionality"""

    def test_check_swarm_status_with_none_client(self):
        """Test check_swarm_status with None client"""
        from utils.diagnostics.docker_env import check_swarm_status

        result = check_swarm_status(None)
        assert result is False

    def test_check_swarm_status_active_swarm(self):
        """Test check_swarm_status with active Swarm"""
        from utils.diagnostics.docker_env import check_swarm_status

        # Mock Docker client with Swarm info
        mock_client = MagicMock()
        mock_client.info.return_value = {
            'Swarm': {
                'NodeID': 'test-node-123',
                'LocalNodeState': 'active'
            }
        }

        # Mock nodes
        mock_node = MagicMock()
        mock_node.id = 'test-node-123'
        mock_node.attrs = {
            'Description': {'Hostname': 'test-host'},
            'Spec': {'Role': 'manager'},
            'Status': {'State': 'ready'}
        }
        mock_client.nodes.list.return_value = [mock_node]

        with patch.dict('os.environ', {'HOSTNAME': 'service.1.task123'}):
            result = check_swarm_status(mock_client)

        assert result is True
        mock_client.info.assert_called_once()

    def test_check_swarm_status_inactive_swarm(self):
        """Test check_swarm_status with inactive Swarm"""
        from utils.diagnostics.docker_env import check_swarm_status

        mock_client = MagicMock()
        mock_client.info.return_value = {
            'Swarm': {
                'NodeID': '',
                'LocalNodeState': 'inactive'
            }
        }

        result = check_swarm_status(mock_client)
        assert result is False

    def test_check_swarm_status_error_getting_nodes(self):
        """Test check_swarm_status when getting nodes fails"""
        from utils.diagnostics.docker_env import check_swarm_status

        mock_client = MagicMock()
        mock_client.info.return_value = {
            'Swarm': {
                'NodeID': 'test-node-123',
                'LocalNodeState': 'active'
            }
        }
        mock_client.nodes.list.side_effect = Exception("Cannot list nodes")

        # Should still return True even if node details fail
        result = check_swarm_status(mock_client)
        assert result is True

    def test_check_swarm_status_exception(self):
        """Test check_swarm_status when client.info() raises exception"""
        from utils.diagnostics.docker_env import check_swarm_status

        mock_client = MagicMock()
        mock_client.info.side_effect = Exception("Connection failed")

        result = check_swarm_status(mock_client)
        assert result is False

    def test_check_swarm_status_non_service_hostname(self):
        """Test check_swarm_status with non-service hostname"""
        from utils.diagnostics.docker_env import check_swarm_status

        mock_client = MagicMock()
        mock_client.info.return_value = {
            'Swarm': {
                'NodeID': 'test-node-123',
                'LocalNodeState': 'active'
            }
        }
        mock_client.nodes.list.return_value = []

        with patch.dict('os.environ', {'HOSTNAME': 'simple-hostname'}):
            result = check_swarm_status(mock_client)

        assert result is True

    def test_check_swarm_status_hostname_check_exception(self):
        """Test check_swarm_status when hostname check raises exception"""
        from utils.diagnostics.docker_env import check_swarm_status

        mock_client = MagicMock()
        mock_client.info.return_value = {
            'Swarm': {
                'NodeID': 'test-node-123',
                'LocalNodeState': 'active'
            }
        }
        mock_client.nodes.list.return_value = []

        # Patch os.getenv to raise exception
        with patch('utils.diagnostics.docker_env.os.getenv', side_effect=Exception("getenv failed")):
            result = check_swarm_status(mock_client)

        # Should still return True since Swarm is active
        assert result is True

    def test_check_swarm_status_no_swarm_key(self):
        """Test check_swarm_status when info doesn't contain Swarm key"""
        from utils.diagnostics.docker_env import check_swarm_status

        mock_client = MagicMock()
        mock_client.info.return_value = {}

        result = check_swarm_status(mock_client)
        assert result is False
