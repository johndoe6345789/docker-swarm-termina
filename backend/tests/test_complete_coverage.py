"""Tests to achieve 100% code coverage."""
import pytest
import os
import time
from unittest.mock import MagicMock, patch, Mock, PropertyMock
from flask_socketio import SocketIOTestClient


class TestHandlerEdgeCases:
    """Test edge cases in terminal handlers"""

    @pytest.fixture
    def socketio_client(self, app):
        """Create a SocketIO test client"""
        from app import socketio
        return socketio.test_client(app, namespace='/terminal')

    def test_disconnect_handler_exception_during_cleanup(self):
        """Test disconnect handler when exec.kill() raises exception"""
        from handlers.terminal.disconnect import handle_disconnect
        from config import active_terminals
        from flask import Flask

        app = Flask(__name__)
        with app.test_request_context():
            with patch('handlers.terminal.disconnect.request') as mock_request:
                mock_request.sid = 'test_exception_sid'

                # Create exec that raises exception on kill
                mock_exec = MagicMock()
                mock_exec.kill.side_effect = Exception("Kill failed")
                active_terminals['test_exception_sid'] = {'exec': mock_exec}

                # Should not raise, just clean up
                handle_disconnect()
                assert 'test_exception_sid' not in active_terminals

    def test_input_handler_no_active_terminal(self):
        """Test input handler when no active terminal exists"""
        from handlers.terminal.input import handle_input
        from flask import Flask
        from flask_socketio import emit

        app = Flask(__name__)
        with app.test_request_context():
            with patch('handlers.terminal.input.request') as mock_request:
                with patch('handlers.terminal.input.emit') as mock_emit:
                    mock_request.sid = 'nonexistent_sid'

                    handle_input({'data': 'test'})

                    # Should emit error
                    mock_emit.assert_called_once()
                    args = mock_emit.call_args[0]
                    assert args[0] == 'error'
                    assert 'No active terminal session' in args[1]['error']

    def test_input_handler_exception(self):
        """Test input handler when sendall raises exception"""
        from handlers.terminal.input import handle_input
        from config import active_terminals
        from flask import Flask

        app = Flask(__name__)
        with app.test_request_context():
            with patch('handlers.terminal.input.request') as mock_request:
                with patch('handlers.terminal.input.emit') as mock_emit:
                    mock_request.sid = 'error_sid'

                    # Mock the _sock attribute which is checked first
                    mock_inner_sock = MagicMock()
                    mock_inner_sock.sendall.side_effect = Exception("Send failed")

                    mock_sock = MagicMock()
                    mock_sock._sock = mock_inner_sock

                    mock_exec = MagicMock()
                    mock_exec.output = mock_sock

                    active_terminals['error_sid'] = {'exec': mock_exec}

                    handle_input({'data': 'test'})

                    # Should emit error
                    mock_emit.assert_called()
                    error_call = [c for c in mock_emit.call_args_list if c[0][0] == 'error']
                    assert len(error_call) > 0

    def test_resize_handler_exception(self):
        """Test resize handler when it raises exception"""
        from handlers.terminal.resize import handle_resize
        from config import active_terminals
        from flask import Flask

        app = Flask(__name__)
        with app.test_request_context():
            with patch('handlers.terminal.resize.request') as mock_request:
                mock_request.sid = 'resize_error_sid'
                active_terminals['resize_error_sid'] = {'exec': MagicMock()}

                # Force an exception by passing invalid data
                with patch('handlers.terminal.resize.logger') as mock_logger:
                    # This should trigger the exception handler
                    handle_resize(None)  # None instead of dict

                    # Should have logged error
                    assert mock_logger.error.called


class TestDockerDiagnostics:
    """Test docker diagnostics edge cases"""

    @patch('os.path.exists')
    @patch('os.listdir')
    def test_diagnose_var_run_not_exists(self, mock_listdir, mock_exists):
        """Test diagnostics when /var/run doesn't exist"""
        from utils.diagnostics.docker_env import diagnose_docker_environment

        mock_exists.return_value = False

        # Should not raise exception
        with patch('utils.diagnostics.docker_env.logger'):
            diagnose_docker_environment()

    @patch('os.path.exists')
    @patch('os.listdir')
    def test_diagnose_var_run_error(self, mock_listdir, mock_exists):
        """Test diagnostics when /var/run listing fails"""
        from utils.diagnostics.docker_env import diagnose_docker_environment

        def exists_side_effect(path):
            if path == '/var/run':
                return True
            return False

        mock_exists.side_effect = exists_side_effect
        mock_listdir.side_effect = Exception("Permission denied")

        # Should handle exception
        with patch('utils.diagnostics.docker_env.logger'):
            diagnose_docker_environment()

    @patch('os.path.exists')
    @patch('os.stat')
    @patch('os.access')
    @patch('os.getuid')
    @patch('os.getgid')
    @patch('os.getgroups')
    def test_diagnose_docker_socket_permissions(
        self, mock_getgroups, mock_getgid, mock_getuid,
        mock_access, mock_stat, mock_exists
    ):
        """Test diagnostics for docker socket with permissions check"""
        from utils.diagnostics.docker_env import diagnose_docker_environment
        import pwd
        import grp

        def exists_side_effect(path):
            if path == '/var/run':
                return False
            if path == '/var/run/docker.sock':
                return True
            return False

        mock_exists.side_effect = exists_side_effect

        # Mock stat for socket
        mock_stat_result = MagicMock()
        mock_stat_result.st_mode = 0o666
        mock_stat_result.st_uid = 0
        mock_stat_result.st_gid = 0
        mock_stat.return_value = mock_stat_result

        # Mock access - not readable/writable
        mock_access.return_value = False

        # Mock user info
        mock_getuid.return_value = 0
        mock_getgid.return_value = 0
        mock_getgroups.return_value = [0, 1]

        with patch('utils.diagnostics.docker_env.logger'):
            with patch('pwd.getpwuid') as mock_getpwuid:
                with patch('grp.getgrgid') as mock_getgrgid:
                    mock_user = MagicMock()
                    mock_user.pw_name = 'root'
                    mock_getpwuid.return_value = mock_user

                    mock_group = MagicMock()
                    mock_group.gr_name = 'root'
                    mock_getgrgid.return_value = mock_group

                    diagnose_docker_environment()

    @patch('os.path.exists')
    @patch('os.getuid')
    def test_diagnose_user_info_error(self, mock_getuid, mock_exists):
        """Test diagnostics when user info lookup fails"""
        from utils.diagnostics.docker_env import diagnose_docker_environment

        mock_exists.return_value = False
        mock_getuid.side_effect = Exception("No user info")

        with patch('utils.diagnostics.docker_env.logger'):
            diagnose_docker_environment()

    @patch('os.path.exists')
    @patch('os.getuid')
    @patch('os.getgid')
    @patch('os.getgroups')
    def test_diagnose_group_lookup_error(self, mock_getgroups, mock_getgid, mock_getuid, mock_exists):
        """Test diagnostics when group lookup fails"""
        from utils.diagnostics.docker_env import diagnose_docker_environment
        import pwd
        import grp

        mock_exists.return_value = False
        mock_getuid.return_value = 0
        mock_getgid.return_value = 0
        mock_getgroups.return_value = [999]  # Non-existent group

        with patch('utils.diagnostics.docker_env.logger'):
            with patch('pwd.getpwuid') as mock_getpwuid:
                with patch('grp.getgrgid') as mock_getgrgid:
                    mock_user = MagicMock()
                    mock_user.pw_name = 'test'
                    mock_getpwuid.return_value = mock_user

                    # Make group lookup fail
                    mock_getgrgid.side_effect = KeyError("Group not found")

                    diagnose_docker_environment()


class TestDockerClientEdgeCases:
    """Test docker client edge cases"""

    @patch('docker.from_env')
    @patch('docker.DockerClient')
    def test_get_docker_client_unexpected_error(self, mock_docker_client, mock_from_env):
        """Test get_docker_client with unexpected error"""
        from utils.docker_client import get_docker_client

        # Make both methods raise unexpected errors
        mock_from_env.side_effect = RuntimeError("Unexpected error")
        mock_docker_client.side_effect = RuntimeError("Unexpected error")

        with patch('utils.docker_client.diagnose_docker_environment'):
            client = get_docker_client()
            assert client is None


class TestExecHelpersEdgeCases:
    """Test exec helpers edge cases"""

    def test_decode_output_empty(self):
        """Test decode_output with empty output"""
        from utils.exec_helpers import decode_output

        mock_exec = MagicMock()
        mock_exec.output = None

        result = decode_output(mock_exec)
        assert result == ''

    def test_decode_output_latin1_fallback(self):
        """Test decode_output falls back to latin-1"""
        from utils.exec_helpers import decode_output

        mock_exec = MagicMock()
        # Create invalid UTF-8 that will force latin-1 fallback
        mock_exec.output = bytes([0xff, 0xfe, 0xfd])

        result = decode_output(mock_exec)
        assert isinstance(result, str)

    def test_extract_workdir_cd_command(self):
        """Test extract_workdir with cd command"""
        from utils.exec_helpers import extract_workdir

        output = "/home/user"
        result_output, result_workdir = extract_workdir(output, "/app", True)

        assert result_output == ''
        assert result_workdir == "/home/user"


class TestTerminalHelpersEdgeCases:
    """Test terminal helpers edge cases"""

    @patch('utils.terminal_helpers.threading.Thread')
    def test_create_output_reader_unicode_decode_error(self, mock_thread):
        """Test output reader handles unicode decode errors"""
        from utils.terminal_helpers import create_output_reader
        from config import active_terminals

        mock_socketio = MagicMock()
        mock_sock = MagicMock()

        # Return invalid UTF-8, then empty to end loop
        mock_sock.recv.side_effect = [
            bytes([0x80, 0x81]),  # Invalid UTF-8
            b''  # EOF
        ]
        mock_sock.close = MagicMock()

        mock_exec = MagicMock()
        mock_exec.output = mock_sock

        sid = 'unicode_test_sid'
        active_terminals[sid] = {'exec': mock_exec}

        # Get the actual thread function that would be called
        def capture_thread_target(*args, **kwargs):
            # Run the target function
            kwargs['target']()
            return MagicMock()

        mock_thread.side_effect = capture_thread_target

        create_output_reader(mock_socketio, sid, mock_exec)

        # Should have emitted with latin-1 decoded data
        assert mock_socketio.emit.called

    @patch('utils.terminal_helpers.threading.Thread')
    def test_create_output_reader_socket_recv_error(self, mock_thread):
        """Test output reader handles recv errors"""
        from utils.terminal_helpers import create_output_reader
        from config import active_terminals

        mock_socketio = MagicMock()
        mock_sock = MagicMock()
        mock_sock.recv.side_effect = Exception("Socket error")
        mock_sock.close = MagicMock()

        mock_exec = MagicMock()
        mock_exec.output = mock_sock

        sid = 'socket_error_sid'
        active_terminals[sid] = {'exec': mock_exec}

        def capture_thread_target(*args, **kwargs):
            kwargs['target']()
            return MagicMock()

        mock_thread.side_effect = capture_thread_target

        create_output_reader(mock_socketio, sid, mock_exec)

        # Should have cleaned up
        assert sid not in active_terminals

    @patch('utils.terminal_helpers.threading.Thread')
    def test_create_output_reader_socket_close_error(self, mock_thread):
        """Test output reader handles close errors"""
        from utils.terminal_helpers import create_output_reader
        from config import active_terminals

        mock_socketio = MagicMock()
        mock_sock = MagicMock()
        mock_sock.recv.return_value = b''  # EOF
        mock_sock.close.side_effect = Exception("Close failed")

        mock_exec = MagicMock()
        mock_exec.output = mock_sock

        sid = 'close_error_sid'
        active_terminals[sid] = {'exec': mock_exec}

        def capture_thread_target(*args, **kwargs):
            kwargs['target']()
            return MagicMock()

        mock_thread.side_effect = capture_thread_target

        # Should not raise exception
        create_output_reader(mock_socketio, sid, mock_exec)
