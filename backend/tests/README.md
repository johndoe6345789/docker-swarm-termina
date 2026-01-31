# Backend Tests

Comprehensive test suite for the Docker Swarm Terminal backend API.

## Test Structure

```
tests/
├── conftest.py                      # Pytest fixtures and configuration
├── test_auth.py                     # Authentication endpoint tests
├── test_containers.py               # Container management tests
├── test_docker_client.py            # Docker client connection tests
├── test_exec.py                     # Command execution tests
├── test_exec_advanced.py            # Advanced execution tests
├── test_health.py                   # Health check tests
├── test_utils.py                    # Utility function tests
├── test_websocket.py                # WebSocket terminal unit tests
├── test_websocket_simulated.py      # WebSocket tests with simulated containers
└── test_websocket_integration.py    # WebSocket integration tests (require Docker)
```

## Running Tests

### Install Dependencies

```bash
pip install -r requirements.txt -r requirements-dev.txt
```

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=. --cov-report=html --cov-report=term-missing
```

This will generate an HTML coverage report in `htmlcov/index.html`.

### Run Specific Test Files

```bash
pytest tests/test_auth.py
pytest tests/test_containers.py -v
```

### Run Tests by Marker

```bash
pytest -m unit          # Run only unit tests (54 tests)
pytest -m integration   # Run only integration tests (requires Docker)
pytest -m "not integration"  # Run all tests except integration tests
```

**Note:** Integration tests will be automatically skipped if Docker is not available.

### Run with Verbose Output

```bash
pytest -v
```

## Test Coverage

Current coverage target: **70%**

To check if tests meet the coverage threshold:

```bash
coverage run -m pytest
coverage report --fail-under=70
```

## Writing Tests

### Test Naming Convention

- Test files: `test_*.py`
- Test classes: `Test*`
- Test functions: `test_*`

### Using Fixtures

Common fixtures available in `conftest.py`:

- `app`: Flask application instance
- `client`: Test client for making HTTP requests
- `auth_token`: Valid authentication token
- `auth_headers`: Authentication headers dict
- `mock_docker_client`: Mocked Docker client

Example:

```python
def test_my_endpoint(client, auth_headers):
    response = client.get('/api/my-endpoint', headers=auth_headers)
    assert response.status_code == 200
```

### Mocking Docker Calls

Use the `@patch` decorator to mock Docker API calls:

```python
from unittest.mock import patch, MagicMock

@patch('app.get_docker_client')
def test_container_operation(mock_get_client, client, auth_headers):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    # Your test code here
```

## CI/CD Integration

Tests automatically run on:
- Every push to any branch
- Every pull request to main
- Multiple Python versions (3.11, 3.12)

GitHub Actions will fail if:
- Any test fails
- Coverage drops below 70%
- Docker images fail to build

## Test Types

### Unit Tests

Unit tests use mocking and don't require external dependencies like Docker. These are marked with `@pytest.mark.unit` and make up the majority of the test suite.

### Integration Tests with Simulated Containers

The `test_websocket_simulated.py` file provides integration-style tests that use simulated Docker containers. These tests:
- Don't require Docker to be installed
- Test the actual logic flow without external dependencies
- Simulate Docker socket behavior including the `_sock` attribute wrapper
- Are marked as unit tests since they don't require Docker

Example simulated container usage:
```python
def test_with_simulated_container(simulated_container):
    exec_instance = simulated_container.exec_run(['/bin/sh'], socket=True)
    sock = exec_instance.output

    # Test socket operations
    sock._sock.sendall(b'echo test\n')
    data = sock.recv(4096)
```

### Real Integration Tests

The `test_websocket_integration.py` file contains tests that require a real Docker environment. These tests:
- Are marked with `@pytest.mark.integration`
- Automatically skip if Docker is not available
- Test with real Docker containers (alpine:latest)
- Verify actual Docker socket behavior

## Troubleshooting

### Tests Failing Locally

1. Ensure all dependencies are installed
2. Check Python version (3.11+ required)
3. Clear pytest cache: `pytest --cache-clear`

### Import Errors

Make sure you're running tests from the backend directory:

```bash
cd backend
pytest
```

### Coverage Not Updating

Clear coverage data and re-run:

```bash
coverage erase
pytest --cov=. --cov-report=term-missing
```
