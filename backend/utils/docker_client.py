"""Docker client getter."""
import docker
from config import logger
from utils.diagnostics.docker_env import diagnose_docker_environment


def get_docker_client():
    """Get Docker client with enhanced error reporting."""
    try:
        logger.info("Attempting to connect to Docker...")

        # Try default connection first
        try:
            client = docker.from_env()
            client.ping()
            logger.info("✓ Successfully connected to Docker using docker.from_env()")
            return client
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("docker.from_env() failed: %s", e)

        # Try explicit Unix socket connection
        try:
            logger.info("Trying explicit Unix socket connection...")
            client = docker.DockerClient(base_url='unix:///var/run/docker.sock')
            client.ping()
            logger.info("✓ Successfully connected to Docker using Unix socket")
            return client
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Unix socket connection failed: %s", e)

        # If all fails, run diagnostics and return None
        logger.error("All Docker connection attempts failed!")
        diagnose_docker_environment()
        return None

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Unexpected error in get_docker_client: %s", e, exc_info=True)
        return None
