# Quick Start Guide

Get up and running with Docker Swarm Terminal in minutes.

## Prerequisites

- CapRover server set up and running
- CapRover CLI installed: `npm install -g caprover`
- Git repository cloned locally

## Option 1: Deploy from Pre-built Releases (Fastest)

### Backend

1. Download `releases/backend-caprover-{version}.tar` from [GitHub Releases](https://github.com/johndoe6345789/docker-swarm-termina/releases)
2. In CapRover dashboard:
   - Create app named `terminalbackend`
   - Enable HTTPS
   - Go to "Deployment" tab
   - Upload the `.tar` file (uncompressed - required by CapRover)
3. Wait for deployment to complete
4. **Check logs for: `✓ Docker connection verified on startup`**

**⚠️ IMPORTANT**: If you see `✗ Docker socket NOT found`, you must manually apply the mount:

```bash
# SSH into your CapRover server
ssh root@your-server.com

# Apply the Docker socket mount
docker service update \
  --mount-add type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  srv-captain--terminalbackend
```

See [CAPROVER_TROUBLESHOOTING.md](CAPROVER_TROUBLESHOOTING.md) for details.

### Frontend

1. Download `releases/frontend-caprover-{version}.tar` from [GitHub Releases](https://github.com/johndoe6345789/docker-swarm-termina/releases)
2. In CapRover dashboard:
   - Create app named `terminalfrontend`
   - Enable HTTPS
   - Set environment variable:
     - `NEXT_PUBLIC_API_URL=https://terminalbackend.yourdomain.com`
   - Upload the `.tar` file (uncompressed - required by CapRover)
3. Visit your frontend URL

## Option 2: Deploy from Source (Latest Changes)

### Backend

```bash
# Login to CapRover
caprover login

# Navigate to backend
cd backend

# Deploy
caprover deploy

# Check logs
caprover logs terminalbackend --follow
```

**⚠️ IMPORTANT**: If logs show `✗ Docker socket NOT found`, manually apply the mount on your CapRover server:

```bash
docker service update \
  --mount-add type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  srv-captain--terminalbackend
```

### Frontend

```bash
cd frontend
caprover deploy
```

## Verification

### Backend Health Check

```bash
curl https://terminalbackend.yourdomain.com/api/health
# Should return: {"status":"healthy"}
```

### Login Test

```bash
curl -X POST https://terminalbackend.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Container List

```bash
# Use the token from login response
curl https://terminalbackend.yourdomain.com/api/containers \
  -H "Authorization: Bearer {your-token}"
```

## Troubleshooting

### "Cannot connect to Docker" Error

1. Check backend logs in CapRover dashboard
2. Look for diagnostic output:
   ```
   === Docker Environment Diagnosis ===
   ```
3. Verify:
   - Socket exists: `✓ Docker socket exists`
   - Permissions: `Readable: True, Writable: True`
   - User: `Current user: root`

4. If socket not found or not writable:
   - Ensure `captain-definition` has correct `serviceUpdateOverride`
   - Redeploy the app (may need to delete and recreate)

### Frontend Can't Connect to Backend

1. Verify backend URL in frontend environment variables
2. Check CORS is enabled (it should be by default)
3. Ensure both apps have HTTPS enabled
4. Check browser console for errors

### Container List Empty

- Verify Docker is running on CapRover host
- Check if user has permission to see containers
- Try running: `docker ps` on the host machine

## Security

**Important**: Change default credentials!

1. In CapRover dashboard, go to backend app
2. Set environment variables:
   - `ADMIN_USERNAME=your_username`
   - `ADMIN_PASSWORD=your_secure_password`
3. Restart the app

## Next Steps

- Read [CAPROVER_DEPLOYMENT.md](CAPROVER_DEPLOYMENT.md) for detailed configuration
- Review [backend/README.md](backend/README.md) for API documentation
- Check [frontend/README.md](frontend/README.md) for frontend details
- Customize the interface and add features

## Getting Help

If you encounter issues:

1. Check application logs (most diagnostic info is there)
2. Review [CAPROVER_DEPLOYMENT.md](CAPROVER_DEPLOYMENT.md) troubleshooting section
3. Ensure CapRover and Docker are up to date
4. Open an issue with logs and diagnostic output
