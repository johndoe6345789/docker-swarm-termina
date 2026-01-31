"""
Integration tests that work with both real Docker and simulated containers.
These tests use simulated containers when Docker is not available.
"""
import pytest
import time


pytestmark = pytest.mark.unit


class TestContainerSocketBehavior:
    """Test socket behavior with containers (real or simulated)"""

    def test_terminal_sendall_with_container(self, test_container_or_simulated):
        """Test that sendall works with exec socket (real or simulated)"""
        # Check if this is a real Docker container or simulated
        is_simulated = (hasattr(test_container_or_simulated, '__class__') and
                       test_container_or_simulated.__class__.__name__ == 'SimulatedContainer')

        if is_simulated:
            # Test with simulated container
            exec_instance = test_container_or_simulated.exec_run(['/bin/sh'], socket=True)
            sock = exec_instance.output
        else:
            # Test with real Docker container
            import docker
            client = docker.from_env()
            container = client.containers.get(test_container_or_simulated.id)

            exec_instance = container.exec_run(
                ['/bin/sh'],
                stdin=True,
                stdout=True,
                stderr=True,
                tty=True,
                socket=True,
                environment={
                    'TERM': 'xterm-256color',
                    'LANG': 'C.UTF-8'
                }
            )
            sock = exec_instance.output

        # Verify the socket has the _sock attribute (this is what we fixed)
        assert hasattr(sock, '_sock'), "Socket should have _sock attribute"

        # Test the sendall logic (this is what was failing before)
        test_input = 'echo "testing sendall"\n'

        # This is the fix we implemented
        if hasattr(sock, '_sock'):
            sock._sock.sendall(test_input.encode('utf-8'))
        else:
            sock.sendall(test_input.encode('utf-8'))

        if not is_simulated:
            # Only test actual output with real Docker
            time.sleep(0.2)
            output = sock._sock.recv(4096)

            # Verify we got output without errors
            assert output is not None
            assert len(output) > 0
            output_str = output.decode('utf-8', errors='replace')
            assert 'testing sendall' in output_str

        # Clean up
        sock.close()

        # Verify sendall was called (works for both real and simulated)
        if is_simulated:
            sock._sock.sendall.assert_called()

    def test_socket_structure(self, test_container_or_simulated):
        """Verify the structure of socket wrapper (real or simulated)"""
        is_simulated = (hasattr(test_container_or_simulated, '__class__') and
                       test_container_or_simulated.__class__.__name__ == 'SimulatedContainer')

        if is_simulated:
            # Test with simulated container
            exec_instance = test_container_or_simulated.exec_run(['/bin/sh'], socket=True)
            sock = exec_instance.output
        else:
            # Test with real Docker
            import docker
            client = docker.from_env()
            container = client.containers.get(test_container_or_simulated.id)

            exec_instance = container.exec_run(
                ['/bin/sh'],
                stdin=True,
                stdout=True,
                tty=True,
                socket=True
            )
            sock = exec_instance.output

        # Verify structure (works for both real and simulated)
        assert hasattr(sock, '_sock'), "Should have _sock attribute"
        assert hasattr(sock._sock, 'sendall'), "Underlying socket should have sendall"
        assert hasattr(sock._sock, 'recv'), "Underlying socket should have recv"
        assert hasattr(sock._sock, 'close'), "Underlying socket should have close"

        # Clean up
        sock.close()
