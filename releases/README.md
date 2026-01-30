# CapRover Release Packages

This directory contains pre-built deployment packages for CapRover.

## Files

Each release includes:
- `backend-caprover-{version}.tar` - Backend Flask application (uncompressed for CapRover)
- `frontend-caprover-{version}.tar` - Frontend Next.js application (uncompressed for CapRover)
- `documentation-{version}.tar.gz` - Deployment documentation (compressed)
- `checksums-{version}.txt` - SHA256 checksums for verification

**Important**: CapRover requires uncompressed `.tar` files for deployment. The backend and frontend packages are provided as uncompressed tarballs.

## Deployment

### Option 1: Upload via CapRover Dashboard

1. Log into your CapRover dashboard
2. Navigate to your app
3. Click "Deploy via tarball"
4. Upload the corresponding `.tar` file (not `.tar.gz` - CapRover requires uncompressed tar)
5. Wait for deployment to complete

### Option 2: Use CapRover CLI

```bash
# Extract the tar file
mkdir backend-temp
tar -xf backend-caprover-{version}.tar -C backend-temp
cd backend-temp

# Deploy using CLI
caprover deploy

# Clean up
cd ..
rm -rf backend-temp
```

### Option 3: Deploy from Source

For the latest changes, deploy directly from source:

```bash
# Backend
cd backend
caprover deploy

# Frontend
cd frontend
caprover deploy
```

## Verification

Verify package integrity using checksums:

```bash
sha256sum -c checksums-{version}.txt
```

## Build Your Own

To build release packages from source:

```bash
./create-caprover-releases.sh
```

This will create new packages in this directory.

## See Also

- [CAPROVER_DEPLOYMENT.md](../CAPROVER_DEPLOYMENT.md) - Complete deployment guide
- [Backend README](../backend/README.md) - Backend documentation
- [Frontend README](../frontend/README.md) - Frontend documentation
