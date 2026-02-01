"""Helper functions for terminal operations."""
import threading
from config import logger, active_terminals


def create_output_reader(socketio, sid, exec_instance):
    """Create and start output reader thread.

    Args:
        socketio: SocketIO instance
        sid: Session ID
        exec_instance: Docker exec instance

    Returns:
        Thread: Started output reader thread
    """
    def read_output():
        sock = exec_instance.output
        try:
            while True:
                if sid not in active_terminals:
                    break

                try:
                    data = sock.recv(4096)
                    if not data:
                        break

                    try:
                        decoded_data = data.decode('utf-8')
                    except UnicodeDecodeError:
                        decoded_data = data.decode('latin-1', errors='replace')

                    socketio.emit('output', {'data': decoded_data},
                                  namespace='/terminal', room=sid)
                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.error("Error reading from container: %s", e)
                    break
        finally:
            if sid in active_terminals:
                del active_terminals[sid]
            try:
                sock.close()
            except Exception:  # pylint: disable=broad-exception-caught
                pass
            socketio.emit('exit', {'code': 0}, namespace='/terminal', room=sid)

    thread = threading.Thread(target=read_output, daemon=True)
    thread.start()
    return thread
