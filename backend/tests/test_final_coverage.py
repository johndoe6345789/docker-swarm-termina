"""Tests for final 100% coverage."""
import pytest
from unittest.mock import MagicMock, patch, Mock, PropertyMock


class TestRemainingHandlerCoverage:
    """Test remaining handler edge cases"""

    def test_resize_with_active_terminal(self):
        """Test resize handler with active terminal"""
        from handlers.terminal.resize import handle_resize
        from config import active_terminals
        from flask import Flask

        app = Flask(__name__)
        with app.test_request_context():
            with patch('handlers.terminal.resize.request') as mock_request:
                with patch('handlers.terminal.resize.logger') as mock_logger:
                    mock_request.sid = 'resize_sid'
                    active_terminals['resize_sid'] = {'exec': MagicMock()}

                    handle_resize({'cols': 120, 'rows': 40})

                    # Should log the resize request
                    mock_logger.info.assert_called()
                    # Clean up
                    del active_terminals['resize_sid']


class TestDockerClientOuterException:
    """Test docker client outer exception handler"""

    @patch('utils.docker_client.docker.from_env')
    @patch('utils.docker_client.docker.DockerClient')
    @patch('utils.docker_client.diagnose_docker_environment')
    def test_get_docker_client_outer_exception(self, mock_diagnose, mock_docker_client, mock_from_env):
        """Test get_docker_client when outer try block catches exception"""
        from utils.docker_client import get_docker_client

        # Make the initial logger.info call raise an exception
        with patch('utils.docker_client.logger') as mock_logger:
            # Raise exception on the first logger.info call
            mock_logger.info.side_effect = Exception("Unexpected logger error")

            client = get_docker_client()
            assert client is None
            mock_logger.error.assert_called()


class TestExecHelpersCdFallback:
    """Test exec helpers cd command fallback to sh"""

    def test_cd_command_sh_fallback(self):
        """Test build_sh_command for cd commands"""
        from utils.exec_helpers import build_sh_command

        result = build_sh_command('/home/user', 'cd /tmp', True)

        assert result[0] == '/bin/sh'
        assert result[1] == '-c'
        assert 'cd "/home/user"' in result[2]
        assert 'cd /tmp' in result[2]
        assert 'pwd' in result[2]


class TestDiagnosticsDockerRelated:
    """Test diagnostics docker-related files logging"""

    @patch('os.path.exists')
    @patch('os.listdir')
    def test_diagnose_with_docker_related_files(self, mock_listdir, mock_exists):
        """Test diagnostics when docker-related files are found"""
        from utils.diagnostics.docker_env import diagnose_docker_environment

        def exists_side_effect(path):
            if path == '/var/run':
                return True
            if path == '/var/run/docker.sock':
                return False
            return False

        mock_exists.side_effect = exists_side_effect
        mock_listdir.return_value = ['docker.pid', 'docker.sock.tmp', 'other.file']

        with patch('utils.diagnostics.docker_env.logger') as mock_logger:
            diagnose_docker_environment()

            # Should log docker-related files
            info_calls = [str(call) for call in mock_logger.info.call_args_list]
            assert any('docker' in str(call).lower() for call in info_calls)

    @patch('os.path.exists')
    @patch('os.stat')
    @patch('os.access')
    def test_diagnose_socket_not_readable_writable(self, mock_access, mock_stat, mock_exists):
        """Test diagnostics when socket exists but not readable/writable"""
        from utils.diagnostics.docker_env import diagnose_docker_environment

        def exists_side_effect(path):
            if path == '/var/run':
                return False
            if path == '/var/run/docker.sock':
                return True
            return False

        mock_exists.side_effect = exists_side_effect

        # Mock stat
        mock_stat_result = MagicMock()
        mock_stat_result.st_mode = 0o600
        mock_stat_result.st_uid = 0
        mock_stat_result.st_gid = 0
        mock_stat.return_value = mock_stat_result

        # Make access return False for both R_OK and W_OK
        mock_access.return_value = False

        with patch('utils.diagnostics.docker_env.logger') as mock_logger:
            diagnose_docker_environment()

            # Should log warning about permissions
            warning_calls = [str(call) for call in mock_logger.warning.call_args_list]
            assert any('permission' in str(call).lower() for call in warning_calls)


class TestTerminalHelpersSidRemoval:
    """Test terminal helpers when sid is removed during execution"""

    @patch('utils.terminal_helpers.threading.Thread')
    def test_output_reader_sid_removed_during_loop(self, mock_thread):
        """Test output reader when sid is removed from active_terminals during loop"""
        from utils.terminal_helpers import create_output_reader
        from config import active_terminals

        mock_socketio = MagicMock()
        mock_sock = MagicMock()

        # Setup to remove sid after first iteration
        call_count = [0]
        def recv_side_effect(size):
            call_count[0] += 1
            if call_count[0] == 1:
                # First call: return data and remove sid
                if 'removal_test_sid' in active_terminals:
                    del active_terminals['removal_test_sid']
                return b'test data'
            # Second call won't happen because sid was removed
            return b''

        mock_sock.recv.side_effect = recv_side_effect
        mock_sock.close = MagicMock()

        mock_exec = MagicMock()
        mock_exec.output = mock_sock

        sid = 'removal_test_sid'
        active_terminals[sid] = {'exec': mock_exec}

        def capture_thread_target(*args, **kwargs):
            # Run the target function
            kwargs['target']()
            return MagicMock()

        mock_thread.side_effect = capture_thread_target

        create_output_reader(mock_socketio, sid, mock_exec)

        # Should have emitted the data and broken out of loop
        assert mock_socketio.emit.called

    @patch('utils.terminal_helpers.threading.Thread')
    def test_output_reader_finally_with_sid_present(self, mock_thread):
        """Test output reader finally block when sid is still in active_terminals"""
        from utils.terminal_helpers import create_output_reader
        from config import active_terminals

        mock_socketio = MagicMock()
        mock_sock = MagicMock()
        mock_sock.recv.return_value = b''  # EOF immediately
        mock_sock.close = MagicMock()

        mock_exec = MagicMock()
        mock_exec.output = mock_sock

        sid = 'finally_test_sid'
        active_terminals[sid] = {'exec': mock_exec}

        def capture_thread_target(*args, **kwargs):
            kwargs['target']()
            return MagicMock()

        mock_thread.side_effect = capture_thread_target

        create_output_reader(mock_socketio, sid, mock_exec)

        # sid should be removed in finally block
        assert sid not in active_terminals


class TestDisconnectNoKillMethod:
    """Test disconnect handler when exec has no kill method"""

    def test_disconnect_exec_without_kill(self):
        """Test disconnect when exec instance has no kill method"""
        from handlers.terminal.disconnect import handle_disconnect
        from config import active_terminals
        from flask import Flask

        app = Flask(__name__)
        with app.test_request_context():
            with patch('handlers.terminal.disconnect.request') as mock_request:
                mock_request.sid = 'no_kill_sid'

                # Create exec without kill method
                mock_exec = MagicMock(spec=['output', 'exit_code'])  # Explicitly exclude 'kill'
                del mock_exec.kill  # Ensure kill is not available
                active_terminals['no_kill_sid'] = {'exec': mock_exec}

                handle_disconnect()

                # Should still clean up
                assert 'no_kill_sid' not in active_terminals


class TestDiagnosticsReadableWritableSocket:
    """Test diagnostics when socket is readable and writable"""

    @patch('os.path.exists')
    @patch('os.stat')
    @patch('os.access')
    def test_diagnose_socket_readable_and_writable(self, mock_access, mock_stat, mock_exists):
        """Test diagnostics when socket exists and is readable/writable"""
        from utils.diagnostics.docker_env import diagnose_docker_environment

        def exists_side_effect(path):
            if path == '/var/run':
                return False
            if path == '/var/run/docker.sock':
                return True
            return False

        mock_exists.side_effect = exists_side_effect

        # Mock stat
        mock_stat_result = MagicMock()
        mock_stat_result.st_mode = 0o666
        mock_stat_result.st_uid = 0
        mock_stat_result.st_gid = 0
        mock_stat.return_value = mock_stat_result

        # Make access return True (readable and writable)
        mock_access.return_value = True

        with patch('utils.diagnostics.docker_env.logger') as mock_logger:
            diagnose_docker_environment()

            # Should log success messages, not warnings
            info_calls = [str(call) for call in mock_logger.info.call_args_list]
            assert any('Readable' in str(call) or 'Writable' in str(call) for call in info_calls)
            # Should NOT log permission warning
            warning_calls = [str(call) for call in mock_logger.warning.call_args_list]
            assert not any('socket' in str(call).lower() and 'permission' in str(call).lower() for call in warning_calls)
