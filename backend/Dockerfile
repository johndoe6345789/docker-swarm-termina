FROM python:3.11-slim

WORKDIR /app

# Install dependencies
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
