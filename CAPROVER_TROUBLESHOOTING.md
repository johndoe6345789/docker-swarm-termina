# CapRover Docker Socket Troubleshooting Guide

This guide helps resolve the "Cannot connect to Docker" error in CapRover deployments.

## Problem: Docker Socket Not Mounted

### Symptoms

In your CapRover application logs, you see:
```
✗ Docker socket NOT found at /var/run/docker.sock
This means the Docker socket mount is NOT configured in CapRover
The serviceUpdateOverride in captain-definition may not be applied
```

### Root Cause

CapRover's `serviceUpdateOverride` in `captain-definition` **may not always be applied automatically**. This is a known limitation with some CapRover versions or configurations.

## Solution: Manual Docker Service Update

You need to manually update the Docker Swarm service to mount the Docker socket.

### Step 1: SSH into Your CapRover Server

```bash
ssh root@your-caprover-server.com
```

### Step 2: Find Your Service Name

List all services to find your backend service:

```bash
docker service ls
```

Look for your service, typically named: `srv-captain--terminalbackend` (or whatever you named your app)

### Step 3: Check Current Mounts

```bash
docker service inspect srv-captain--terminalbackend \
  --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}' | python3 -m json.tool
```

If this returns `null` or an empty array, the mount isn't configured.

### Step 4: Apply the Docker Socket Mount

Run this command to mount the Docker socket:

```bash
docker service update \
  --mount-add type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  srv-captain--terminalbackend
```

**Important**: Replace `srv-captain--terminalbackend` with your actual service name.

### Step 5: Verify the Mount

```bash
docker service inspect srv-captain--terminalbackend \
  --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}' | python3 -m json.tool
```

You should see:
```json
[
    {
        "Type": "bind",
        "Source": "/var/run/docker.sock",
        "Target": "/var/run/docker.sock"
    }
]
```

### Step 6: Wait for Service Restart

Docker Swarm will automatically restart your service with the new configuration. Monitor the status:

```bash
docker service ps srv-captain--terminalbackend --no-trunc
```

### Step 7: Check Logs

In CapRover dashboard, go to your app and check logs. You should now see:

```
✓ Docker socket exists at /var/run/docker.sock
Socket permissions: 0o140777
Readable: True
Writable: True
✓ Successfully connected to Docker using Unix socket
✓ Docker connection verified on startup
```

### Step 8: Test the API

```bash
curl https://terminalbackend.wardcrew.com/api/health
```

Should return:
```json
{"status":"healthy"}
```

## Automated Script

We've provided a script to automate this process. Download it from the repository:

```bash
# On your CapRover server
wget https://raw.githubusercontent.com/johndoe6345789/docker-swarm-termina/main/fix-caprover-docker-mount.sh
chmod +x fix-caprover-docker-mount.sh

# Run it
./fix-caprover-docker-mount.sh srv-captain--terminalbackend
```

## Alternative Solution: Use CapRover's Service Update Feature

Some CapRover versions support manual service configuration through the UI:

1. Go to CapRover dashboard
2. Navigate to your app
3. Click on "⚙️ Edit Default Nginx Configurations" (or similar settings)
4. Look for advanced Docker/Swarm settings
5. Add the mount configuration

However, this feature availability varies by CapRover version.

## Why serviceUpdateOverride Doesn't Always Work

The `captain-definition` file's `serviceUpdateOverride` field is designed to apply custom Docker Swarm configurations. However:

1. **Timing Issue**: It may only apply on initial deployment, not on updates
2. **CapRover Version**: Older versions may not fully support this feature
3. **Validation**: CapRover may skip configurations it deems risky
4. **Security**: Some CapRover installations restrict privileged configurations

## Persistence

Once you've manually applied the mount using `docker service update`, it will **persist across app updates** as long as you don't:

- Delete and recreate the app in CapRover
- Manually remove the mount
- Use a CapRover feature that resets service configuration

## Additional Troubleshooting

### Issue: "Permission denied" errors

**Solution**: Ensure the service runs as root:

```bash
docker service update \
  --user root \
  srv-captain--terminalbackend
```

### Issue: Socket exists but connection still fails

**Diagnosis**: Check socket permissions on the host:

```bash
ls -la /var/run/docker.sock
```

Should be:
```
srw-rw---- 1 root docker /var/run/docker.sock
```

**Solution**: Fix permissions:

```bash
chmod 666 /var/run/docker.sock  # Temporary - not recommended for production
# OR
chmod 660 /var/run/docker.sock
chown root:docker /var/run/docker.sock
```

### Issue: "Not supported URL scheme http+docker"

This error indicates a docker-py library issue.

**Solution**: Update the docker library version in `requirements.txt`:

```
docker==7.1.0
```

Then redeploy the app.

### Issue: Can't find service name

**Solution**: List all services with details:

```bash
docker service ls --format "table {{.Name}}\t{{.Mode}}\t{{.Replicas}}"
```

Look for services starting with `srv-captain--`

### Issue: Mount applied but service won't start

**Diagnosis**: Check service logs:

```bash
docker service logs srv-captain--terminalbackend --tail 100 --follow
```

**Common causes**:
- SELinux blocking socket access
- AppArmor policies
- Container runtime restrictions

**Solution**: Temporarily disable SELinux/AppArmor to test:

```bash
# SELinux
setenforce 0

# After testing, re-enable
setenforce 1
```

## Production Recommendations

For production deployments:

1. **Use Docker Socket Proxy**: Instead of mounting the raw socket, use a proxy like [tecnativa/docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy)

2. **Limit API Access**: Configure proxy to only allow specific Docker API endpoints

3. **Network Isolation**: Deploy backend on a dedicated private network

4. **Audit Logging**: Enable Docker audit logging for socket access

5. **Regular Updates**: Keep Docker, CapRover, and your application updated

## Support

If you're still experiencing issues:

1. **Check CapRover version**: `caprover --version`
2. **Check Docker version**: `docker version`
3. **Review CapRover logs**: `docker service logs captain-captain --tail 100`
4. **Test Docker socket on host**: `docker ps` (should work without errors)

Open an issue with:
- CapRover version
- Docker version
- Complete application logs
- Output of `docker service inspect srv-captain--terminalbackend`
