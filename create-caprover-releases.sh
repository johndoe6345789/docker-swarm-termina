#!/bin/bash
# Script to create CapRover deployment tar files for releases

set -e

echo "Creating CapRover deployment packages..."

# Create releases directory if it doesn't exist
mkdir -p releases

# Get version from git or use timestamp
VERSION=$(git describe --tags --always 2>/dev/null || date +%Y%m%d-%H%M%S)

# Backend tar file (CapRover requires uncompressed tar)
echo "Creating backend package..."
cd backend
tar -cf "../releases/backend-caprover-${VERSION}.tar" \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='venv' \
    --exclude='.git' \
    .
cd ..

echo "✓ Created: releases/backend-caprover-${VERSION}.tar"

# Frontend tar file (CapRover requires uncompressed tar)
echo "Creating frontend package..."
cd frontend
tar -cf "../releases/frontend-caprover-${VERSION}.tar" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='.git' \
    .
cd ..

echo "✓ Created: releases/frontend-caprover-${VERSION}.tar"

# Create a compressed documentation package (for download convenience)
echo "Creating documentation package..."
tar -czf "releases/documentation-${VERSION}.tar.gz" \
    CAPROVER_DEPLOYMENT.md \
    QUICKSTART.md \
    README.md \
    backend/README.md \
    frontend/README.md 2>/dev/null || true

echo "✓ Created: releases/documentation-${VERSION}.tar.gz"

# Create checksums
echo "Creating checksums..."
cd releases
sha256sum backend-caprover-${VERSION}.tar frontend-caprover-${VERSION}.tar documentation-${VERSION}.tar.gz > "checksums-${VERSION}.txt"
cd ..

echo "✓ Created: releases/checksums-${VERSION}.txt"

echo ""
echo "=== Release Packages Created ==="
echo "Version: ${VERSION}"
echo ""
ls -lh releases/backend-caprover-${VERSION}.tar releases/frontend-caprover-${VERSION}.tar releases/documentation-${VERSION}.tar.gz
echo ""
echo "To deploy to CapRover:"
echo "  1. Upload backend-caprover-${VERSION}.tar to your backend app"
echo "  2. Upload frontend-caprover-${VERSION}.tar to your frontend app"
echo ""
echo "Or use CapRover CLI from the respective directories:"
echo "  cd backend && caprover deploy"
echo "  cd frontend && caprover deploy"
