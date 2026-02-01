"""Helper functions for container exec operations."""
from config import logger


def get_session_workdir(token, container_id, session_workdirs):
    """Get or initialize session working directory.

    Args:
        token: Session token
        container_id: Container ID
        session_workdirs: Session workdir dictionary

    Returns:
        tuple: (session_key, current_workdir)
    """
    session_key = f"{token}_{container_id}"
    if session_key not in session_workdirs:
        session_workdirs[session_key] = '/'
    return session_key, session_workdirs[session_key]


def execute_command_with_fallback(container, current_workdir, user_command, is_cd_command):
    """Execute command in container with bash/sh fallback.

    Args:
        container: Docker container object
        current_workdir: Current working directory
        user_command: User's command
        is_cd_command: Whether this is a cd command

    Returns:
        Docker exec instance
    """
    # Try bash first
    try:
        bash_command = build_bash_command(current_workdir, user_command, is_cd_command)
        return execute_in_container(container, bash_command)
    except Exception as bash_error:  # pylint: disable=broad-exception-caught
        logger.warning("Bash execution failed, trying sh: %s", bash_error)
        sh_command = build_sh_command(current_workdir, user_command, is_cd_command)
        return execute_in_container(container, sh_command)


def build_bash_command(current_workdir, user_command, is_cd_command):
    """Build bash command for execution.

    Args:
        current_workdir: Current working directory
        user_command: User's command
        is_cd_command: Whether this is a cd command

    Returns:
        list: Command array for Docker exec
    """
    path_export = 'export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

    if is_cd_command:
        target_dir = user_command.strip()[3:].strip() or '~'
        resolve_command = f'cd "{current_workdir}" && cd {target_dir} && pwd'
        return ['/bin/bash', '-c', f'{path_export}; {resolve_command}']

    return [
        '/bin/bash', '-c',
        f'{path_export}; cd "{current_workdir}" && {user_command}; echo "::WORKDIR::$(pwd)"'
    ]


def build_sh_command(current_workdir, user_command, is_cd_command):
    """Build sh command for execution (fallback).

    Args:
        current_workdir: Current working directory
        user_command: User's command
        is_cd_command: Whether this is a cd command

    Returns:
        list: Command array for Docker exec
    """
    path_export = 'export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

    if is_cd_command:
        target_dir = user_command.strip()[3:].strip() or '~'
        resolve_command = f'cd "{current_workdir}" && cd {target_dir} && pwd'
        return ['/bin/sh', '-c', f'{path_export}; {resolve_command}']

    return [
        '/bin/sh', '-c',
        f'{path_export}; cd "{current_workdir}" && {user_command}; echo "::WORKDIR::$(pwd)"'
    ]


def execute_in_container(container, command):
    """Execute command in container.

    Args:
        container: Docker container object
        command: Command to execute

    Returns:
        Docker exec instance
    """
    return container.exec_run(
        command,
        stdout=True,
        stderr=True,
        stdin=False,
        tty=True,
        environment={'TERM': 'xterm-256color', 'LANG': 'C.UTF-8'}
    )


def decode_output(exec_instance):
    """Decode exec output with fallback encoding.

    Args:
        exec_instance: Docker exec instance

    Returns:
        str: Decoded output
    """
    if not exec_instance.output:
        return ''

    try:
        return exec_instance.output.decode('utf-8')
    except UnicodeDecodeError:
        return exec_instance.output.decode('latin-1', errors='replace')


def extract_workdir(output, current_workdir, is_cd_command):
    """Extract working directory from command output.

    Args:
        output: Command output
        current_workdir: Current working directory
        is_cd_command: Whether this was a cd command

    Returns:
        tuple: (cleaned_output, new_workdir)
    """
    if is_cd_command:
        return '', output.strip()

    if '::WORKDIR::' in output:
        parts = output.rsplit('::WORKDIR::', 1)
        return parts[0], parts[1].strip()

    return output, current_workdir
