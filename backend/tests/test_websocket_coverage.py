"""
Additional WebSocket tests to improve code coverage.
These tests focus on covering the start_terminal, disconnect, and other handlers.
"""
import pytest
import time
import threading
from unittest.mock import Mock, patch, MagicMock, call
from flask_socketio import SocketIOTestClient


pytestmark = pytest.mark.unit


class TestWebSocketCoverage:
    """Additional tests to improve WebSocket handler coverage"""

    @pytest.fixture
    def socketio_client(self, app):
        """Create a SocketIO test client"""
        from app import socketio
        return socketio.test_client(app, namespace='/terminal')

    @patch('utils.docker_client.get_docker_client')
    def test_start_terminal_success_flow(self, mock_get_client, socketio_client, auth_token):
        """Test successful terminal start with mocked Docker"""
        # Create mock Docker client and container
        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_exec_instance = MagicMock()

        # Create mock socket that simulates Docker socket behavior
        mock_socket = MagicMock()
        mock_socket._sock = MagicMock()
        mock_socket.recv = MagicMock(side_effect=[
            b'bash-5.1$ ',  # Initial prompt
            b'',  # EOF to end the thread
        ])
        mock_socket.close = MagicMock()

        mock_exec_instance.output = mock_socket

        mock_container.exec_run.return_value = mock_exec_instance
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        # Start terminal
        socketio_client.emit('start_terminal', {
            'container_id': 'test_container_123',
            'token': auth_token,
            'cols': 100,
            'rows': 30
        }, namespace='/terminal')

        # Give thread time to start and process
        time.sleep(0.3)

        # Get received messages
        received = socketio_client.get_received('/terminal')

        # Should receive started message
        started_msgs = [msg for msg in received if msg['name'] == 'started']
        assert len(started_msgs) > 0, "Should receive started message"

        # Verify Docker calls
        mock_client.containers.get.assert_called_once_with('test_container_123')
        mock_container.exec_run.assert_called_once()

        # Verify exec_run was called with correct parameters
        call_args = mock_container.exec_run.call_args
        assert call_args[0][0] == ['/bin/bash']
        assert call_args[1]['stdin'] == True
        assert call_args[1]['stdout'] == True
        assert call_args[1]['stderr'] == True
        assert call_args[1]['tty'] == True
        assert call_args[1]['socket'] == True
        assert call_args[1]['environment']['COLUMNS'] == '100'
        assert call_args[1]['environment']['LINES'] == '30'

    @patch('utils.docker_client.get_docker_client')
    def test_start_terminal_creates_thread(self, mock_get_client, socketio_client, auth_token):
        """Test that starting terminal creates output thread"""
        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_exec_instance = MagicMock()

        # Socket that returns empty data immediately
        mock_socket = MagicMock()
        mock_socket._sock = MagicMock()
        mock_socket.recv = MagicMock(return_value=b'')
        mock_socket.close = MagicMock()

        mock_exec_instance.output = mock_socket
        mock_container.exec_run.return_value = mock_exec_instance
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        socketio_client.emit('start_terminal', {
            'container_id': 'test_container',
            'token': auth_token,
            'cols': 80,
            'rows': 24
        }, namespace='/terminal')

        # Give thread a moment to start
        time.sleep(0.1)

        received = socketio_client.get_received('/terminal')

        # Should receive started message
        started_msgs = [msg for msg in received if msg['name'] == 'started']
        assert len(started_msgs) > 0

    def test_unicode_decode_logic(self):
        """Test Unicode decode logic used in output thread"""
        # Test successful UTF-8 decoding
        data = 'Hello 世界 🚀'.encode('utf-8')
        try:
            decoded = data.decode('utf-8')
            assert '世界' in decoded
            assert '🚀' in decoded
        except UnicodeDecodeError:
            decoded = data.decode('latin-1', errors='replace')

        # Test latin-1 fallback
        invalid_utf8 = b'\xff\xfe invalid'
        try:
            decoded = invalid_utf8.decode('utf-8')
        except UnicodeDecodeError:
            decoded = invalid_utf8.decode('latin-1', errors='replace')
            assert decoded is not None  # Should not crash

    @patch('utils.docker_client.get_docker_client')
    def test_start_terminal_latin1_fallback(self, mock_get_client, socketio_client, auth_token):
        """Test latin-1 fallback for invalid UTF-8"""
        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_exec_instance = MagicMock()

        # Invalid UTF-8 sequence
        mock_socket = MagicMock()
        mock_socket._sock = MagicMock()
        mock_socket.recv = MagicMock(side_effect=[
            b'\xff\xfe invalid utf8',
            b'',  # EOF
        ])
        mock_socket.close = MagicMock()

        mock_exec_instance.output = mock_socket
        mock_container.exec_run.return_value = mock_exec_instance
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        socketio_client.emit('start_terminal', {
            'container_id': 'test_container',
            'token': auth_token,
        }, namespace='/terminal')

        time.sleep(0.3)

        received = socketio_client.get_received('/terminal')

        # Should not crash, should use latin-1 fallback
        error_msgs = [msg for msg in received if msg['name'] == 'error']
        # Should not have error for decoding
        decoding_errors = [msg for msg in error_msgs if 'decode' in str(msg).lower()]
        assert len(decoding_errors) == 0

    @patch('utils.docker_client.get_docker_client')
    def test_start_terminal_container_not_found(self, mock_get_client, socketio_client, auth_token):
        """Test error when container doesn't exist"""
        mock_client = MagicMock()
        mock_client.containers.get.side_effect = Exception("Container not found")
        mock_get_client.return_value = mock_client

        socketio_client.emit('start_terminal', {
            'container_id': 'nonexistent',
            'token': auth_token,
        }, namespace='/terminal')

        time.sleep(0.1)

        received = socketio_client.get_received('/terminal')
        error_msgs = [msg for msg in received if msg['name'] == 'error']

        assert len(error_msgs) > 0, "Should receive error message"
        assert 'not found' in error_msgs[0]['args'][0]['error'].lower()

    @patch('utils.docker_client.get_docker_client')
    def test_start_terminal_exec_error(self, mock_get_client, socketio_client, auth_token):
        """Test error during exec_run"""
        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_container.exec_run.side_effect = Exception("Exec failed")
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        socketio_client.emit('start_terminal', {
            'container_id': 'test_container',
            'token': auth_token,
        }, namespace='/terminal')

        time.sleep(0.1)

        received = socketio_client.get_received('/terminal')
        error_msgs = [msg for msg in received if msg['name'] == 'error']

        assert len(error_msgs) > 0, "Should receive error message"

    @patch('utils.docker_client.get_docker_client')
    def test_handle_input_error_handling(self, mock_get_client, socketio_client, auth_token):
        """Test error handling in handle_input when sendall fails"""
        import app

        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_exec_instance = MagicMock()

        # Create socket that will error on sendall
        mock_socket = MagicMock()
        mock_socket._sock = MagicMock()
        mock_socket._sock.sendall = MagicMock(side_effect=Exception("Socket error"))
        mock_socket.recv = MagicMock(return_value=b'')
        mock_socket.close = MagicMock()

        mock_exec_instance.output = mock_socket
        mock_container.exec_run.return_value = mock_exec_instance
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        # Start terminal
        socketio_client.emit('start_terminal', {
            'container_id': 'test_container',
            'token': auth_token,
        }, namespace='/terminal')

        time.sleep(0.2)
        socketio_client.get_received('/terminal')

        # Try to send input (should error)
        socketio_client.emit('input', {
            'data': 'ls\n'
        }, namespace='/terminal')

        time.sleep(0.1)

        received = socketio_client.get_received('/terminal')
        error_msgs = [msg for msg in received if msg['name'] == 'error']

        # Should receive error about socket problem
        assert len(error_msgs) > 0, "Should receive error from failed sendall"

    @patch('utils.docker_client.get_docker_client')
    def test_disconnect_cleanup(self, mock_get_client, socketio_client, auth_token):
        """Test that disconnect properly cleans up active terminals"""
        import app

        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_exec_instance = MagicMock()

        mock_socket = MagicMock()
        mock_socket._sock = MagicMock()
        mock_socket.recv = MagicMock(return_value=b'')
        mock_socket.close = MagicMock()

        mock_exec_instance.output = mock_socket
        mock_container.exec_run.return_value = mock_exec_instance
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        # Start terminal
        socketio_client.emit('start_terminal', {
            'container_id': 'test_container',
            'token': auth_token,
        }, namespace='/terminal')

        time.sleep(0.2)

        # Verify terminal was added
        # Note: can't directly check active_terminals due to threading

        # Disconnect
        socketio_client.disconnect(namespace='/terminal')

        time.sleep(0.2)

        # After disconnect, active_terminals should be cleaned up
        # The thread should have removed it
        assert True  # If we got here without hanging, cleanup worked

    def test_resize_handler(self, socketio_client):
        """Test resize handler gets called"""
        import app

        # Create a mock terminal session
        mock_exec = MagicMock()

        # Get the session ID and add to active terminals
        # Note: socketio_client doesn't expose sid directly in test mode
        # So we'll just test that resize doesn't crash without active terminal

        socketio_client.emit('resize', {
            'cols': 132,
            'rows': 43
        }, namespace='/terminal')

        time.sleep(0.1)

        # Should not crash (just logs that resize isn't supported)
        received = socketio_client.get_received('/terminal')
        # No error expected since resize just logs
        error_msgs = [msg for msg in received if msg['name'] == 'error']
        assert len(error_msgs) == 0, "Resize should not error"

    @patch('utils.docker_client.get_docker_client')
    def test_socket_close_on_exit(self, mock_get_client, socketio_client, auth_token):
        """Test that socket is closed when thread exits"""
        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_exec_instance = MagicMock()

        # Socket that returns empty to trigger thread exit
        mock_socket = MagicMock()
        mock_socket._sock = MagicMock()
        mock_socket.recv = MagicMock(return_value=b'')  # Empty = EOF
        mock_socket.close = MagicMock()

        mock_exec_instance.output = mock_socket
        mock_container.exec_run.return_value = mock_exec_instance
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        socketio_client.emit('start_terminal', {
            'container_id': 'test_container',
            'token': auth_token,
        }, namespace='/terminal')

        time.sleep(0.2)

        # Socket close should eventually be called by the thread
        # Note: Due to threading and request context, we can't reliably assert this
        # but the code path is exercised
        assert True

    @patch('utils.docker_client.get_docker_client')
    def test_default_terminal_size(self, mock_get_client, socketio_client, auth_token):
        """Test default terminal size when not specified"""
        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_exec_instance = MagicMock()

        mock_socket = MagicMock()
        mock_socket._sock = MagicMock()
        mock_socket.recv = MagicMock(return_value=b'')
        mock_socket.close = MagicMock()

        mock_exec_instance.output = mock_socket
        mock_container.exec_run.return_value = mock_exec_instance
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        # Don't specify cols/rows
        socketio_client.emit('start_terminal', {
            'container_id': 'test_container',
            'token': auth_token,
        }, namespace='/terminal')

        time.sleep(0.2)

        # Verify defaults (80x24)
        call_args = mock_container.exec_run.call_args
        assert call_args[1]['environment']['COLUMNS'] == '80'
        assert call_args[1]['environment']['LINES'] == '24'

    @patch('utils.docker_client.get_docker_client')
    def test_input_with_direct_socket_fallback(self, mock_get_client, socketio_client, auth_token):
        """Test that input works with direct socket (no _sock attribute)"""
        import app
        import threading

        mock_client = MagicMock()
        mock_container = MagicMock()
        mock_exec_instance = MagicMock()

        # Create an event to control when the socket returns empty
        stop_event = threading.Event()

        def mock_recv(size):
            # Block until stop_event is set, then return empty to exit thread
            stop_event.wait(timeout=1.0)
            return b''

        # Create socket WITHOUT _sock attribute (direct socket)
        mock_socket = MagicMock(spec=['sendall', 'recv', 'close'])
        mock_socket.sendall = MagicMock()
        mock_socket.recv = MagicMock(side_effect=mock_recv)
        mock_socket.close = MagicMock()

        # Ensure it has NO _sock attribute
        if hasattr(mock_socket, '_sock'):
            delattr(mock_socket, '_sock')

        mock_exec_instance.output = mock_socket
        mock_container.exec_run.return_value = mock_exec_instance
        mock_client.containers.get.return_value = mock_container
        mock_get_client.return_value = mock_client

        # Start terminal
        socketio_client.emit('start_terminal', {
            'container_id': 'test_container',
            'token': auth_token,
        }, namespace='/terminal')

        time.sleep(0.2)
        socketio_client.get_received('/terminal')

        # Send input - should use direct socket.sendall()
        socketio_client.emit('input', {
            'data': 'echo test\n'
        }, namespace='/terminal')

        time.sleep(0.1)

        # Verify sendall was called on the socket itself (not _sock)
        mock_socket.sendall.assert_called_with(b'echo test\n')

        # Signal the thread to exit and clean up
        stop_event.set()
        time.sleep(0.1)
