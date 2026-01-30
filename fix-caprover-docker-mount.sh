#!/bin/bash
# Script to manually apply Docker socket mount to CapRover service
# Run this on your CapRover server if serviceUpdateOverride doesn't work

set -e

# Service name - update this to match your CapRover app name
SERVICE_NAME="${1:-srv-captain--terminalbackend}"

echo "=== CapRover Docker Socket Mount Fix ==="
echo "Service name: $SERVICE_NAME"
echo ""

# Check if service exists
if ! docker service ls | grep -q "$SERVICE_NAME"; then
    echo "❌ Error: Service '$SERVICE_NAME' not found"
    echo ""
    echo "Available services:"
    docker service ls --format "{{.Name}}"
    echo ""
    echo "Usage: $0 <service-name>"
    echo "Example: $0 srv-captain--terminalbackend"
    exit 1
fi

echo "✓ Service found"
echo ""

# Show current service configuration
echo "Current service mounts:"
docker service inspect "$SERVICE_NAME" --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}' | python3 -m json.tool || echo "No mounts configured"
echo ""

# Update service with Docker socket mount
echo "Applying Docker socket mount..."
docker service update \
    --mount-add type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
    "$SERVICE_NAME"

echo ""
echo "✓ Mount applied successfully"
echo ""

# Verify the update
echo "Verifying updated configuration:"
docker service inspect "$SERVICE_NAME" --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}' | python3 -m json.tool
echo ""

# Check service status
echo "Service status:"
docker service ps "$SERVICE_NAME" --no-trunc
echo ""

echo "=== Next Steps ==="
echo "1. Wait for the service to restart (check logs in CapRover dashboard)"
echo "2. Look for this in logs: '✓ Docker socket exists at /var/run/docker.sock'"
echo "3. Test the API: curl https://your-backend-domain.com/api/health"
echo ""
echo "If you still see errors, check:"
echo "  - The service is running as root (not restricted by CapRover)"
echo "  - SELinux/AppArmor isn't blocking socket access"
echo "  - Docker socket exists on host: ls -la /var/run/docker.sock"
