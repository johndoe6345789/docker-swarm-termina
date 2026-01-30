# Backend - Flask API

Python Flask backend for Docker container management.

## Features

- RESTful API for container management
- Docker SDK integration
- Session-based authentication
- CORS enabled for frontend access

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Run the server:
```bash
python app.py
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout current session

### Containers
- `GET /api/containers` - List all containers (requires auth)
- `POST /api/containers/<id>/exec` - Execute command in container (requires auth)

### Health
- `GET /api/health` - Health check

## Docker

Build the Docker image:
```bash
docker build -t docker-swarm-backend .
```

Run the container:
```bash
docker run -p 5000:5000 -v /var/run/docker.sock:/var/run/docker.sock docker-swarm-backend
```

## Debugging

The application includes comprehensive Docker connection diagnostics that run automatically on startup. Check the logs for:

- Docker environment variables (DOCKER_HOST, DOCKER_CERT_PATH, etc.)
- Docker socket existence and permissions
- Current user and group information
- Connection attempt results

Example output:
```
=== Docker Environment Diagnosis ===
DOCKER_HOST: unix:///var/run/docker.sock
✓ Docker socket exists at /var/run/docker.sock
Socket permissions: 0o140777
Readable: True
Writable: True
Current user: root (UID: 0, GID: 0)
✓ Successfully connected to Docker using Unix socket
✓ Docker connection verified on startup
```

If connection fails, the diagnostics will show detailed information about what's wrong.

## CapRover Deployment

For deploying to CapRover (which uses Docker Swarm), see the detailed guide in [CAPROVER_DEPLOYMENT.md](../CAPROVER_DEPLOYMENT.md).

Key points:
- Uses `captain-definition` file with `serviceUpdateOverride` to mount Docker socket
- Runs as root to access Docker socket
- Includes enhanced debugging for troubleshooting connection issues
- Only supports 1 replica (Docker socket can't be shared)

## Security

⚠️ This backend requires access to the Docker socket. Ensure proper security measures are in place in production environments.

**Security Considerations:**
- Container has root access to the host system via Docker socket
- Implement strong authentication (change default credentials)
- Restrict network access to the API
- Only use in trusted environments
- Monitor logs for suspicious activity
- Consider using a Docker socket proxy for additional security
