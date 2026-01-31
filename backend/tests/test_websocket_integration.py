"""
Real integration tests that require an actual Docker environment.
These tests will be skipped if Docker is not available.

For tests that work without Docker, see test_websocket_simulated.py
"""
import pytest
import time


def docker_available():
    """Check if Docker is available"""
    try:
        import docker
        client = docker.from_env()
        client.ping()
        return True
    except Exception:
        return False


# Mark all tests in this module as integration tests
# Skip if Docker is not available
pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not docker_available(), reason="Docker is not available")
]


class TestWebSocketRealDocker:
    """Integration tests for WebSocket terminal with real Docker containers"""

    def test_terminal_sendall_with_real_docker_socket(self, test_container_or_simulated):
        """Test that sendall works with real Docker exec socket"""
        # Skip if we got a simulated container
        if hasattr(test_container_or_simulated, '__class__') and \
           test_container_or_simulated.__class__.__name__ == 'SimulatedContainer':
            pytest.skip("Real Docker not available, got simulated container")

        import docker

        # Get a real Docker client
        client = docker.from_env()
        container = client.containers.get(test_container_or_simulated.id)

        # Create an exec instance with socket=True (like the actual code)
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

        # Get the socket
        sock = exec_instance.output

        # Verify the socket has the _sock attribute (this is what we fixed)
        assert hasattr(sock, '_sock'), "Docker exec socket should have _sock attribute"

        # Test the sendall logic (this is what was failing before)
        test_input = 'echo "testing sendall"\n'

        # This is the fix we implemented
        if hasattr(sock, '_sock'):
            sock._sock.sendall(test_input.encode('utf-8'))
        else:
            sock.sendall(test_input.encode('utf-8'))

        # Read response
        time.sleep(0.2)
        output = sock.recv(4096)

        # Clean up
        sock.close()

        # Verify we got output without errors
        assert output is not None
        assert len(output) > 0
        # The output should contain our echo
        output_str = output.decode('utf-8', errors='replace')
        assert 'testing sendall' in output_str

    def test_docker_socket_structure(self, test_container_or_simulated):
        """Verify the actual structure of Docker's socket wrapper"""
        # Skip if we got a simulated container
        if hasattr(test_container_or_simulated, '__class__') and \
           test_container_or_simulated.__class__.__name__ == 'SimulatedContainer':
            pytest.skip("Real Docker not available, got simulated container")

        import docker

        client = docker.from_env()
        container = client.containers.get(test_container_or_simulated.id)

        # Create exec with socket=True
        exec_instance = container.exec_run(
            ['/bin/sh'],
            stdin=True,
            stdout=True,
            tty=True,
            socket=True
        )

        sock = exec_instance.output

        # Verify structure
        assert hasattr(sock, '_sock'), "Should have _sock attribute"
        assert hasattr(sock._sock, 'sendall'), "Underlying socket should have sendall"
        assert hasattr(sock._sock, 'recv'), "Underlying socket should have recv"

        # Clean up
        sock.close()
