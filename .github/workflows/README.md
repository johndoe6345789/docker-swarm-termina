# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflows

### test.yml
Runs on every push and pull request to ensure code quality:
- **Backend Tests**: Runs pytest with coverage on Python 3.11 and 3.12
  - Requires 70% test coverage minimum
  - Uploads coverage reports to Codecov
- **Frontend Tests**: Lints and builds the Next.js frontend
- **Docker Build Test**: Validates Docker images can be built successfully

### docker-publish.yml
Runs on pushes to main and version tags:
- Builds and pushes Docker images to GitHub Container Registry (GHCR)
- Creates multi-platform images for both backend and frontend
- Tags images with branch name, PR number, version, and commit SHA

### create-release.yml
Handles release creation and management

## Test Coverage Requirements

Backend tests must maintain at least 70% code coverage. The pipeline will fail if coverage drops below this threshold.

## Local Testing

To run tests locally before pushing:

```bash
# Backend tests
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest --cov=. --cov-report=term-missing

# Frontend build
cd frontend
npm install
npm run build
```

## Adding New Tests

When adding new features:
1. Write unit tests in `backend/tests/test_*.py`
2. Ensure all tests pass locally
3. Push changes - the CI will automatically run all tests
4. Fix any failing tests before merging
