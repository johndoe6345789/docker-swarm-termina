"""Docker environment diagnostics."""
import os
from config import logger


def diagnose_docker_environment():
    """Diagnose Docker environment and configuration."""
    logger.info("=== Docker Environment Diagnosis ===")

    # Check environment variables
    docker_host = os.getenv('DOCKER_HOST', 'Not set')
    docker_cert_path = os.getenv('DOCKER_CERT_PATH', 'Not set')
    docker_tls_verify = os.getenv('DOCKER_TLS_VERIFY', 'Not set')

    logger.info("DOCKER_HOST: %s", docker_host)
    logger.info("DOCKER_CERT_PATH: %s", docker_cert_path)
    logger.info("DOCKER_TLS_VERIFY: %s", docker_tls_verify)

    # Check what's in /var/run
    logger.info("Checking /var/run directory contents:")
    try:
        if os.path.exists('/var/run'):
            var_run_contents = os.listdir('/var/run')
            logger.info("  /var/run contains: %s", var_run_contents)

            # Check for any Docker-related files
            docker_related = [f for f in var_run_contents if 'docker' in f.lower()]
            if docker_related:
                logger.info("  Docker-related files/dirs found: %s", docker_related)
        else:
            logger.warning("  /var/run directory doesn't exist")
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("  Error reading /var/run: %s", e)

    # Check Docker socket
    socket_path = '/var/run/docker.sock'
    logger.info("Checking Docker socket at %s", socket_path)

    if os.path.exists(socket_path):
        logger.info("✓ Docker socket exists at %s", socket_path)

        # Check permissions
        import stat  # pylint: disable=import-outside-toplevel
        st = os.stat(socket_path)
        logger.info("  Socket permissions: %s", oct(st.st_mode))
        logger.info("  Socket owner UID: %s", st.st_uid)
        logger.info("  Socket owner GID: %s", st.st_gid)

        # Check if readable/writable
        readable = os.access(socket_path, os.R_OK)
        writable = os.access(socket_path, os.W_OK)
        logger.info("  Readable: %s", readable)
        logger.info("  Writable: %s", writable)

        if not (readable and writable):
            logger.warning("⚠ Socket exists but lacks proper permissions!")
    else:
        logger.error("✗ Docker socket NOT found at %s", socket_path)
        logger.error("  This means the Docker socket mount is NOT configured in CapRover")
        logger.error("  The serviceUpdateOverride in captain-definition may not be applied")

    # Check current user
    import pwd  # pylint: disable=import-outside-toplevel
    try:
        current_uid = os.getuid()
        current_gid = os.getgid()
        user_info = pwd.getpwuid(current_uid)
        logger.info("Current user: %s (UID: %s, GID: %s)",
                    user_info.pw_name, current_uid, current_gid)

        # Check groups
        import grp  # pylint: disable=import-outside-toplevel
        groups = os.getgroups()
        logger.info("User groups (GIDs): %s", groups)

        for gid in groups:
            try:
                group_info = grp.getgrgid(gid)
                logger.info("  - %s (GID: %s)", group_info.gr_name, gid)
            except KeyError:
                logger.info("  - Unknown group (GID: %s)", gid)
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Error checking user info: %s", e)

    logger.info("=== End Diagnosis ===")
