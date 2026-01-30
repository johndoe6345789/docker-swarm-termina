# CapRover Deployment Guide

This guide provides comprehensive instructions for deploying the Docker Swarm Terminal application on CapRover.

## Overview

CapRover uses Docker Swarm under the hood, which affects how containers interact with the Docker daemon. This application requires access to the Docker socket to manage containers.

## Architecture

- **Frontend**: Next.js application (deployed separately)
- **Backend**: Flask API that requires Docker socket access

## Backend Deployment (Critical Configuration)

### Understanding the Docker Socket Issue

The backend needs to access the Docker daemon to list and manage containers. In a Docker Swarm environment (which CapRover uses), containers don't automatically have access to the Docker socket. This requires special configuration.

### Captain Definition Configuration

The `backend/captain-definition` file contains critical configuration:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile",
  "serviceUpdateOverride": {
    "TaskTemplate": {
      "ContainerSpec": {
        "Mounts": [
          {
            "Type": "bind",
            "Source": "/var/run/docker.sock",
            "Target": "/var/run/docker.sock",
            "ReadOnly": false
          }
        ],
        "User": "root",
        "Env": [
          "DOCKER_HOST=unix:///var/run/docker.sock"
        ]
      },
      "RestartPolicy": {
        "Condition": "any",
        "Delay": 5000000000,
        "MaxAttempts": 0
      }
    },
    "Mode": {
      "Replicated": {
        "Replicas": 1
      }
    }
  }
}
```

#### Key Configuration Elements:

1. **Mounts**: Binds the host's Docker socket into the container
   - `Source`: `/var/run/docker.sock` (host socket)
   - `Target`: `/var/run/docker.sock` (container socket)
   - `ReadOnly`: `false` (allows write operations)

2. **User**: Set to `root` to ensure socket access permissions

3. **Environment Variables**: Sets `DOCKER_HOST` to explicitly point to the socket

4. **RestartPolicy**: Ensures the service recovers from failures

5. **Replicas**: Set to 1 (multiple replicas can't share the same socket)

### ⚠️ IMPORTANT: serviceUpdateOverride Limitation

**The `serviceUpdateOverride` in `captain-definition` may not be applied automatically by CapRover.** This is a known limitation with some CapRover versions.

**If you see "Docker socket NOT found" in your logs**, you MUST manually apply the Docker socket mount after deployment.

**Quick Fix** (run on your CapRover server):
```bash
# SSH into your CapRover server
ssh root@your-server.com

# Apply the mount (replace with your service name)
docker service update \
  --mount-add type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  srv-captain--terminalbackend
```

**See [CAPROVER_TROUBLESHOOTING.md](CAPROVER_TROUBLESHOOTING.md) for detailed instructions.**

### Security Considerations

**IMPORTANT**: Granting Docker socket access to a container is a security-sensitive operation. The container effectively has root access to the host system.

- Only use this in trusted environments
- Consider implementing additional authentication/authorization
- Monitor container logs for suspicious activity
- Restrict network access to the backend API

### Step-by-Step Deployment

#### 1. Create the Backend App in CapRover

```bash
# Login to your CapRover CLI
caprover login

# Create a new app
caprover apps:create terminalbackend
```

#### 2. Configure the App

In the CapRover dashboard:

1. Go to your app settings
2. Enable **HTTP Settings** → **HTTPS**
3. Set environment variables (if needed):
   - `ADMIN_USERNAME` (default: admin)
   - `ADMIN_PASSWORD` (default: admin123)

#### 3. Deploy the Backend

From the `backend` directory:

```bash
# Navigate to backend directory
cd backend

# Deploy to CapRover
caprover deploy
```

Or manually:

1. Create a tarball: `tar -cf backend.tar .`
2. Upload via CapRover dashboard
3. Wait for deployment to complete

#### 4. **CRITICAL: Verify and Apply Docker Socket Mount**

After deployment, check if the Docker socket is mounted:

**a) Check Application Logs** (in CapRover dashboard):

Look for:
```
✓ Docker socket exists at /var/run/docker.sock
✓ Docker connection verified on startup
```

If you see:
```
✗ Docker socket NOT found at /var/run/docker.sock
```

Then the `serviceUpdateOverride` wasn't applied. **You must manually apply it.**

**b) Manually Apply the Mount** (run on your CapRover server):

```bash
# SSH into your CapRover server
ssh root@your-server.com

# Find your service name
docker service ls | grep terminalbackend
# Should show something like: srv-captain--terminalbackend

# Apply the Docker socket mount
docker service update \
  --mount-add type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  srv-captain--terminalbackend
```

**c) Verify the Mount Was Applied**:

```bash
docker service inspect srv-captain--terminalbackend \
  --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}' | python3 -m json.tool
```

Should show:
```json
[
    {
        "Type": "bind",
        "Source": "/var/run/docker.sock",
        "Target": "/var/run/docker.sock"
    }
]
```

**d) Wait for Service Restart**:

The service will automatically restart with the new configuration. Monitor:
```bash
docker service ps srv-captain--terminalbackend
```

**e) Check Logs Again**:

In CapRover dashboard, refresh the logs. You should now see:
```
✓ Docker socket exists at /var/run/docker.sock
✓ Docker connection verified on startup
```

**See [CAPROVER_TROUBLESHOOTING.md](CAPROVER_TROUBLESHOOTING.md) for detailed troubleshooting.**

#### 5. Test the API

```bash
# Health check
curl https://terminalbackend.wardcrew.com/api/health

# Login
curl -X POST https://terminalbackend.wardcrew.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# List containers (replace TOKEN with the token from login response)
curl https://terminalbackend.wardcrew.com/api/containers \
  -H "Authorization: Bearer TOKEN"
```

## Frontend Deployment

The frontend is a standard Next.js application and doesn't require Docker socket access.

### Captain Definition

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

### Environment Variables

Set these in the CapRover dashboard:

- `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://terminalbackend.wardcrew.com`)

### Deployment Steps

```bash
cd frontend
caprover deploy
```

## Troubleshooting

### "Cannot connect to Docker" Error

**This is the most common issue!** CapRover's `serviceUpdateOverride` often doesn't apply automatically.

#### Quick Fix (Run on CapRover Server)

```bash
# SSH into your CapRover server
ssh root@your-server.com

# Apply the Docker socket mount manually
docker service update \
  --mount-add type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  srv-captain--terminalbackend

# Verify it worked
docker service inspect srv-captain--terminalbackend \
  --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}' | python3 -m json.tool
```

**📖 See [CAPROVER_TROUBLESHOOTING.md](CAPROVER_TROUBLESHOOTING.md) for complete step-by-step instructions.**

#### Diagnostic Checklist

If the quick fix doesn't work, check:

1. **Check logs in CapRover dashboard** for:
   ```
   ✗ Docker socket NOT found at /var/run/docker.sock
   ```

2. **Verify socket exists on host**:
   ```bash
   ls -la /var/run/docker.sock
   ```

3. **Check service is running as root**:
   ```bash
   docker service inspect srv-captain--terminalbackend \
     --format '{{.Spec.TaskTemplate.ContainerSpec.User}}'
   ```
   Should return: `root`

4. **Check Docker version compatibility**:
   ```bash
   docker version
   ```

5. **Review SELinux/AppArmor** if on RHEL/Ubuntu:
   ```bash
   getenforce  # Should be Permissive or Disabled for testing
   ```

#### Common Issues

**Socket not found**:
- ✅ **Solution**: Manually apply mount (see Quick Fix above)
- The `serviceUpdateOverride` wasn't applied by CapRover

**Permission denied**:
- ✅ **Solution**: Ensure service runs as root:
  ```bash
  docker service update --user root srv-captain--terminalbackend
  ```

**Connection refused / "Not supported URL scheme http+docker"**:
- ✅ **Solution**: Update docker library version in `requirements.txt` to `docker==7.1.0`
- Redeploy the application

### Viewing Logs

In CapRover dashboard:
1. Go to your app
2. Click "App Logs"
3. Look for diagnostic output

Or via CLI:
```bash
caprover logs terminalbackend
```

### Force Redeploy

Sometimes CapRover needs a fresh deployment:

1. Delete the app in CapRover dashboard
2. Recreate it
3. Deploy again

Or update the app version:
```bash
# Add a label or update Dockerfile
# Then redeploy
caprover deploy
```

### Testing Docker Access Manually

SSH into the CapRover server and run:

```bash
# Find your container
docker ps | grep terminalbackend

# Execute into the container
docker exec -it <container_id> bash

# Inside container, test Docker access
python3 << EOF
import docker
client = docker.from_env()
print(client.ping())
print(client.containers.list())
EOF
```

## Advanced Configuration

### Restricting Container Access

To limit which containers the backend can see/manage, you could:

1. Use Docker socket proxy (like [tecnativa/docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy))
2. Filter containers by label in the backend code
3. Implement RBAC in the backend API

### High Availability

For production:
- This configuration only supports 1 replica (Docker socket can't be shared)
- For HA, consider using Docker Swarm API directly instead of socket
- Or deploy backend on a dedicated manager node

### Monitoring

Add health checks and monitoring:
```json
"HealthCheck": {
  "Test": ["CMD", "curl", "-f", "http://localhost:5000/api/health"],
  "Interval": 30000000000,
  "Timeout": 10000000000,
  "Retries": 3
}
```

## Complete Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│ CapRover (Docker Swarm)                         │
│                                                 │
│  ┌──────────────────┐      ┌─────────────────┐ │
│  │ Frontend         │      │ Backend         │ │
│  │ (Next.js)        │─────▶│ (Flask)         │ │
│  │                  │ API  │                 │ │
│  └──────────────────┘      │ /var/run/       │ │
│                            │ docker.sock     │ │
│                            │ (mounted)       │ │
│                            └────────┬────────┘ │
│                                     │          │
│                            ┌────────▼────────┐ │
│                            │ Docker Daemon   │ │
│                            │ (Host)          │ │
│                            └─────────────────┘ │
└─────────────────────────────────────────────────┘
```

## References

- [CapRover Documentation](https://caprover.com/docs)
- [Docker Swarm Services](https://docs.docker.com/engine/swarm/services/)
- [Docker SDK for Python](https://docker-py.readthedocs.io/)
- [Docker Socket Security](https://docs.docker.com/engine/security/#docker-daemon-attack-surface)

## Support

If you continue to experience issues:

1. Check the application logs (detailed diagnostics are now included)
2. Verify your CapRover version is up to date
3. Ensure Docker is running properly on the host
4. Review CapRover firewall/network settings
