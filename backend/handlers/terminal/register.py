"""Register all terminal WebSocket handlers."""
from handlers.terminal.connect import handle_connect
from handlers.terminal.disconnect import handle_disconnect
from handlers.terminal.start import handle_start_terminal
from handlers.terminal.input import handle_input
from handlers.terminal.resize import handle_resize


def register_terminal_handlers(socketio):
    """Register all terminal WebSocket event handlers.

    Args:
        socketio: SocketIO instance to register handlers with
    """
    @socketio.on('connect', namespace='/terminal')
    def on_connect():
        return handle_connect()

    @socketio.on('disconnect', namespace='/terminal')
    def on_disconnect():
        return handle_disconnect()

    @socketio.on('start_terminal', namespace='/terminal')
    def on_start_terminal(data):
        return handle_start_terminal(socketio, data)

    @socketio.on('input', namespace='/terminal')
    def on_input(data):
        return handle_input(data)

    @socketio.on('resize', namespace='/terminal')
    def on_resize(data):
        return handle_resize(data)
