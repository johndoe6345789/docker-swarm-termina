"""
Integration-style tests using simulated Docker containers.
These tests verify the WebSocket terminal logic without requiring real Docker.
"""
import pytest
from unittest.mock import Mock, patch


pytestmark = pytest.mark.unit


class TestWebSocketWithSimulatedContainer:
    """Test WebSocket handlers with simulated Docker containers"""

    def test_sendall_with_simulated_socket_wrapper(self, simulated_container):
        """Test sendall works correctly with simulated Docker socket wrapper"""
        # Get an exec instance from simulated container
        exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)

        # Get the socket (which has _sock attribute like real Docker sockets)
        sock = exec_instance.output

        # Verify it has _sock attribute
        assert hasattr(sock, '_sock'), "Simulated socket should have _sock attribute"

        # Test the sendall logic from handle_input
        input_data = 'echo "test"\n'

        if hasattr(sock, '_sock'):
            sock._sock.sendall(input_data.encode('utf-8'))
        else:
            sock.sendall(input_data.encode('utf-8'))

        # Verify sendall was called on the underlying socket
        sock._sock.sendall.assert_called_once_with(b'echo "test"\n')

    def test_simulated_exec_recv(self, simulated_container):
        """Test receiving data from simulated exec socket"""
        exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)
        sock = exec_instance.output

        # Read data
        data = sock.recv(4096)

        # Should get simulated response
        assert data is not None
        assert len(data) > 0
        assert b'test' in data

    def test_simulated_socket_lifecycle(self, simulated_container):
        """Test simulated socket open/close lifecycle"""
        exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)
        sock = exec_instance.output

        # Socket should be open
        assert not sock.closed

        # Should be able to receive data
        data = sock.recv(1024)
        assert data is not None

        # Close socket
        sock.close()
        assert sock.closed

        # After close, should return empty
        data = sock.recv(1024)
        assert data == b''

    def test_handle_input_logic_with_simulated_container(self, simulated_container):
        """Test handle_input logic with simulated container"""
        # This test verifies the core logic without calling the actual handler
        # (which requires Flask request context)

        # Create exec instance
        exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)

        # Simulate the logic from handle_input
        input_data = 'ls -la\n'
        sock = exec_instance.output

        # This is the actual logic from handle_input
        if hasattr(sock, '_sock'):
            sock._sock.sendall(input_data.encode('utf-8'))
        else:
            sock.sendall(input_data.encode('utf-8'))

        # Verify sendall was called on the underlying socket
        exec_instance.output._sock.sendall.assert_called_once_with(b'ls -la\n')

    def test_multiple_commands_simulated(self, simulated_container):
        """Test sending multiple commands to simulated container"""
        exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)
        sock = exec_instance.output

        commands = ['ls\n', 'pwd\n', 'echo hello\n']

        for cmd in commands:
            if hasattr(sock, '_sock'):
                sock._sock.sendall(cmd.encode('utf-8'))
            else:
                sock.sendall(cmd.encode('utf-8'))

        # Verify all commands were sent
        assert sock._sock.sendall.call_count == len(commands)

        # Verify the calls
        calls = sock._sock.sendall.call_args_list
        for i, cmd in enumerate(commands):
            assert calls[i][0][0] == cmd.encode('utf-8')

    def test_unicode_handling_simulated(self, simulated_container):
        """Test Unicode handling with simulated container"""
        exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)
        sock = exec_instance.output

        # Send Unicode
        unicode_text = 'echo "Hello 世界 🚀"\n'

        if hasattr(sock, '_sock'):
            sock._sock.sendall(unicode_text.encode('utf-8'))
        else:
            sock.sendall(unicode_text.encode('utf-8'))

        # Verify it was encoded and sent correctly
        sock._sock.sendall.assert_called_once()
        sent_data = sock._sock.sendall.call_args[0][0]

        # Should be valid UTF-8
        decoded = sent_data.decode('utf-8')
        assert '世界' in decoded
        assert '🚀' in decoded

    def test_empty_input_simulated(self, simulated_container):
        """Test handling empty input with simulated container"""
        exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)
        sock = exec_instance.output

        # Send empty string
        empty_input = ''

        if hasattr(sock, '_sock'):
            sock._sock.sendall(empty_input.encode('utf-8'))
        else:
            sock.sendall(empty_input.encode('utf-8'))

        # Should still work, just send empty bytes
        sock._sock.sendall.assert_called_once_with(b'')

    def test_binary_data_simulated(self, simulated_container):
        """Test handling binary/control characters with simulated container"""
        exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)
        sock = exec_instance.output

        # Send control characters (Ctrl+C, Ctrl+D, etc.)
        control_chars = '\x03\x04'  # Ctrl+C, Ctrl+D

        if hasattr(sock, '_sock'):
            sock._sock.sendall(control_chars.encode('utf-8'))
        else:
            sock.sendall(control_chars.encode('utf-8'))

        # Should handle control characters
        sock._sock.sendall.assert_called_once()
        assert sock._sock.sendall.call_args[0][0] == b'\x03\x04'
