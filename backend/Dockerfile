# Build and test stage
FROM python:3.11-slim AS test

WORKDIR /app

# Install dependencies (both production and dev)
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-dev.txt

# Copy application
COPY . .

# Run tests with coverage and generate test-passed marker
RUN pytest --cov=. --cov-report=term-missing --cov-report=xml --cov-branch --cov-fail-under=70 -v \
    && touch /app/.tests-passed

# Production stage
FROM python:3.11-slim AS production

WORKDIR /app

# Copy test verification marker from test stage (ensures tests passed)
COPY --from=test /app/.tests-passed /tmp/.tests-passed

# Install production dependencies only
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Run as root to access Docker socket (required for Docker API access)
# In production, you may want to use a specific user with docker group permissions
USER root

# Run the application
CMD ["python", "app.py"]
