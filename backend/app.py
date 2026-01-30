from flask import Flask, jsonify, request
from flask_cors import CORS
import docker
import os
import sys
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Simple in-memory session storage (in production, use proper session management)
sessions = {}
# Track working directory per session
session_workdirs = {}

# Default credentials (should be environment variables in production)
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')

def diagnose_docker_environment():
    """Diagnose Docker environment and configuration"""
    logger.info("=== Docker Environment Diagnosis ===")

    # Check environment variables
    docker_host = os.getenv('DOCKER_HOST', 'Not set')
    docker_cert_path = os.getenv('DOCKER_CERT_PATH', 'Not set')
    docker_tls_verify = os.getenv('DOCKER_TLS_VERIFY', 'Not set')

    logger.info(f"DOCKER_HOST: {docker_host}")
    logger.info(f"DOCKER_CERT_PATH: {docker_cert_path}")
    logger.info(f"DOCKER_TLS_VERIFY: {docker_tls_verify}")

    # Check what's in /var/run
    logger.info("Checking /var/run directory contents:")
    try:
        if os.path.exists('/var/run'):
            var_run_contents = os.listdir('/var/run')
            logger.info(f"  /var/run contains: {var_run_contents}")

            # Check for any Docker-related files
            docker_related = [f for f in var_run_contents if 'docker' in f.lower()]
            if docker_related:
                logger.info(f"  Docker-related files/dirs found: {docker_related}")
        else:
            logger.warning("  /var/run directory doesn't exist")
    except Exception as e:
        logger.error(f"  Error reading /var/run: {e}")

    # Check Docker socket
    socket_path = '/var/run/docker.sock'
    logger.info(f"Checking Docker socket at {socket_path}")

    if os.path.exists(socket_path):
        logger.info(f"✓ Docker socket exists at {socket_path}")

        # Check permissions
        import stat
        st = os.stat(socket_path)
        logger.info(f"  Socket permissions: {oct(st.st_mode)}")
        logger.info(f"  Socket owner UID: {st.st_uid}")
        logger.info(f"  Socket owner GID: {st.st_gid}")

        # Check if readable/writable
        readable = os.access(socket_path, os.R_OK)
        writable = os.access(socket_path, os.W_OK)
        logger.info(f"  Readable: {readable}")
        logger.info(f"  Writable: {writable}")

        if not (readable and writable):
            logger.warning(f"⚠ Socket exists but lacks proper permissions!")
    else:
        logger.error(f"✗ Docker socket NOT found at {socket_path}")
        logger.error(f"  This means the Docker socket mount is NOT configured in CapRover")
        logger.error(f"  The serviceUpdateOverride in captain-definition may not be applied")

    # Check current user
    import pwd
    try:
        current_uid = os.getuid()
        current_gid = os.getgid()
        user_info = pwd.getpwuid(current_uid)
        logger.info(f"Current user: {user_info.pw_name} (UID: {current_uid}, GID: {current_gid})")

        # Check groups
        import grp
        groups = os.getgroups()
        logger.info(f"User groups (GIDs): {groups}")

        for gid in groups:
            try:
                group_info = grp.getgrgid(gid)
                logger.info(f"  - {group_info.gr_name} (GID: {gid})")
            except:
                logger.info(f"  - Unknown group (GID: {gid})")
    except Exception as e:
        logger.error(f"Error checking user info: {e}")

    logger.info("=== End Diagnosis ===")

def get_docker_client():
    """Get Docker client with enhanced error reporting"""
    try:
        logger.info("Attempting to connect to Docker...")

        # Try default connection first
        try:
            client = docker.from_env()
            # Test the connection
            client.ping()
            logger.info("✓ Successfully connected to Docker using docker.from_env()")
            return client
        except Exception as e:
            logger.warning(f"docker.from_env() failed: {e}")

        # Try explicit Unix socket connection
        try:
            logger.info("Trying explicit Unix socket connection...")
            client = docker.DockerClient(base_url='unix:///var/run/docker.sock')
            client.ping()
            logger.info("✓ Successfully connected to Docker using Unix socket")
            return client
        except Exception as e:
            logger.warning(f"Unix socket connection failed: {e}")

        # If all fails, run diagnostics and return None
        logger.error("All Docker connection attempts failed!")
        diagnose_docker_environment()
        return None

    except Exception as e:
        logger.error(f"Unexpected error in get_docker_client: {e}", exc_info=True)
        return None

def format_uptime(created_at):
    """Format container uptime"""
    created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    now = datetime.now(created.tzinfo)
    delta = now - created
    
    days = delta.days
    hours = delta.seconds // 3600
    minutes = (delta.seconds % 3600) // 60
    
    if days > 0:
        return f"{days}d {hours}h"
    elif hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m"

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        # Create a simple session token (in production, use JWT or proper session management)
        session_token = f"session_{username}_{datetime.now().timestamp()}"
        sessions[session_token] = {
            'username': username,
            'created_at': datetime.now()
        }
        return jsonify({
            'success': True,
            'token': session_token,
            'username': username
        })
    
    return jsonify({
        'success': False,
        'message': 'Invalid credentials'
    }), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        if token in sessions:
            del sessions[token]
    
    return jsonify({'success': True})

@app.route('/api/containers', methods=['GET'])
def get_containers():
    """Get list of all containers"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split(' ')[1]
    if token not in sessions:
        return jsonify({'error': 'Invalid session'}), 401
    
    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500
    
    try:
        containers = client.containers.list(all=True)
        container_list = []
        
        for container in containers:
            container_list.append({
                'id': container.short_id,
                'name': container.name,
                'image': container.image.tags[0] if container.image.tags else 'unknown',
                'status': container.status,
                'uptime': format_uptime(container.attrs['Created']) if container.status == 'running' else 'N/A'
            })
        
        return jsonify({'containers': container_list})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/containers/<container_id>/exec', methods=['POST'])
def exec_container(container_id):
    """Execute command in container"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    if token not in sessions:
        return jsonify({'error': 'Invalid session'}), 401

    data = request.get_json()
    user_command = data.get('command', 'echo "No command provided"')

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)

        # Get or initialize session working directory
        session_key = f"{token}_{container_id}"
        if session_key not in session_workdirs:
            # Get container's default working directory or use root
            session_workdirs[session_key] = '/'

        current_workdir = session_workdirs[session_key]

        # Check if this is a cd command
        cd_match = user_command.strip()
        is_cd_command = cd_match.startswith('cd ')

        # If it's a cd command, handle it specially
        if is_cd_command:
            target_dir = cd_match[3:].strip() or '~'
            # Resolve the new directory and update session
            resolve_command = f'cd "{current_workdir}" && cd {target_dir} && pwd'
            bash_command = [
                '/bin/bash',
                '-c',
                f'export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin; {resolve_command}'
            ]
        else:
            # Regular command - execute in current working directory
            bash_command = [
                '/bin/bash',
                '-c',
                f'export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin; cd "{current_workdir}" && {user_command}; echo "::WORKDIR::$(pwd)"'
            ]

        # Try bash first, fallback to sh if bash doesn't exist
        try:
            exec_instance = container.exec_run(
                bash_command,
                stdout=True,
                stderr=True,
                stdin=False,
                tty=True,
                environment={'TERM': 'xterm-256color', 'LANG': 'C.UTF-8'}
            )
        except Exception as bash_error:
            logger.warning(f"Bash execution failed, trying sh: {bash_error}")
            # Fallback to sh
            if is_cd_command:
                target_dir = cd_match[3:].strip() or '~'
                resolve_command = f'cd "{current_workdir}" && cd {target_dir} && pwd'
                sh_command = ['/bin/sh', '-c', f'export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin; {resolve_command}']
            else:
                sh_command = ['/bin/sh', '-c', f'export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin; cd "{current_workdir}" && {user_command}; echo "::WORKDIR::$(pwd)"']

            exec_instance = container.exec_run(
                sh_command,
                stdout=True,
                stderr=True,
                stdin=False,
                tty=True,
                environment={'TERM': 'xterm-256color', 'LANG': 'C.UTF-8'}
            )

        # Decode output with error handling
        output = ''
        if exec_instance.output:
            try:
                output = exec_instance.output.decode('utf-8')
            except UnicodeDecodeError:
                # Try latin-1 as fallback
                output = exec_instance.output.decode('latin-1', errors='replace')

        # Extract and update working directory from output
        new_workdir = current_workdir
        if is_cd_command:
            # For cd commands, the output is the new pwd
            new_workdir = output.strip()
            session_workdirs[session_key] = new_workdir
            output = ''  # Don't show the pwd output for cd
        else:
            # Extract workdir marker from output
            if '::WORKDIR::' in output:
                parts = output.rsplit('::WORKDIR::', 1)
                output = parts[0]
                new_workdir = parts[1].strip()
                session_workdirs[session_key] = new_workdir

        return jsonify({
            'output': output,
            'exit_code': exec_instance.exit_code,
            'workdir': new_workdir
        })
    except Exception as e:
        logger.error(f"Error executing command: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/containers/<container_id>/start', methods=['POST'])
def start_container(container_id):
    """Start a stopped container"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    if token not in sessions:
        return jsonify({'error': 'Invalid session'}), 401

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)
        container.start()
        logger.info(f"Started container {container_id}")
        return jsonify({'success': True, 'message': f'Container {container_id} started'})
    except Exception as e:
        logger.error(f"Error starting container: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/containers/<container_id>/stop', methods=['POST'])
def stop_container(container_id):
    """Stop a running container"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    if token not in sessions:
        return jsonify({'error': 'Invalid session'}), 401

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)
        container.stop()
        logger.info(f"Stopped container {container_id}")
        return jsonify({'success': True, 'message': f'Container {container_id} stopped'})
    except Exception as e:
        logger.error(f"Error stopping container: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/containers/<container_id>/restart', methods=['POST'])
def restart_container(container_id):
    """Restart a container"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    if token not in sessions:
        return jsonify({'error': 'Invalid session'}), 401

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)
        container.restart()
        logger.info(f"Restarted container {container_id}")
        return jsonify({'success': True, 'message': f'Container {container_id} restarted'})
    except Exception as e:
        logger.error(f"Error restarting container: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/containers/<container_id>', methods=['DELETE'])
def remove_container(container_id):
    """Remove a container"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    if token not in sessions:
        return jsonify({'error': 'Invalid session'}), 401

    client = get_docker_client()
    if not client:
        return jsonify({'error': 'Cannot connect to Docker'}), 500

    try:
        container = client.containers.get(container_id)
        # Force remove (including if running)
        container.remove(force=True)
        logger.info(f"Removed container {container_id}")
        return jsonify({'success': True, 'message': f'Container {container_id} removed'})
    except Exception as e:
        logger.error(f"Error removing container: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    # Run diagnostics on startup
    logger.info("Backend server starting...")
    diagnose_docker_environment()

    # Try to get Docker client and log result
    test_client = get_docker_client()
    if test_client:
        logger.info("✓ Docker connection verified on startup")
    else:
        logger.error("✗ Docker connection FAILED on startup - check logs above for details")

    app.run(host='0.0.0.0', port=5000, debug=True)
