# Backend Tests

Comprehensive test suite for the Docker Swarm Terminal backend API.

## Test Structure

```
tests/
├── conftest.py          # Pytest fixtures and configuration
├── test_auth.py         # Authentication endpoint tests
├── test_containers.py   # Container management tests
├── test_exec.py         # Command execution tests
├── test_health.py       # Health check tests
└── test_utils.py        # Utility function tests
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
pytest -m unit          # Run only unit tests
pytest -m integration   # Run only integration tests
```

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
