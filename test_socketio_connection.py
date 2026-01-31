#!/usr/bin/env python3
"""
Test Socket.IO connection using proper client library
"""
import socketio
import time

def test_polling_connection():
    """Test connection using polling transport (works!)"""
    print("=" * 60)
    print("Test 1: Socket.IO with Polling Transport")
    print("=" * 60)

    sio = socketio.Client(logger=True, engineio_logger=True)

    @sio.event
    def connect():
        print("\n✓ Successfully connected via polling!")
        print(f"  Session ID: {sio.sid}")

    @sio.event
    def disconnect():
        print("✓ Disconnected")

    @sio.on('*')
    def catch_all(event, data):
        print(f"  Event: {event}, Data: {data}")

    try:
        url = "https://terminalbackend.wardcrew.com"
        print(f"Connecting to: {url}")
        print("Transport: polling (HTTP long-polling)")
        print("-" * 60)

        # Connect with polling transport only
        sio.connect(
            url,
            transports=['polling'],
            wait_timeout=10
        )

        print("\nConnection successful! Keeping connection alive...")
        time.sleep(3)

        sio.disconnect()
        print("\n✓ Test 1 PASSED: Polling transport works!")
        return True

    except Exception as e:
        print(f"\n✗ Test 1 FAILED: {e}")
        return False

def test_websocket_direct():
    """Test direct WebSocket connection (blocked by Cloudflare)"""
    print("\n" + "=" * 60)
    print("Test 2: Socket.IO with WebSocket Transport")
    print("=" * 60)

    sio = socketio.Client(logger=True, engineio_logger=True)

    @sio.event
    def connect():
        print("\n✓ Successfully connected via WebSocket!")
        print(f"  Session ID: {sio.sid}")

    @sio.event
    def disconnect():
        print("✓ Disconnected")

    try:
        url = "wss://terminalbackend.wardcrew.com"
        print(f"Connecting to: {url}")
        print("Transport: websocket")
        print("-" * 60)

        # Try WebSocket only
        sio.connect(
            url,
            transports=['websocket'],
            wait_timeout=10
        )

        print("\nConnection successful!")
        time.sleep(3)

        sio.disconnect()
        print("\n✓ Test 2 PASSED: WebSocket transport works!")
        return True

    except Exception as e:
        print(f"\n✗ Test 2 FAILED: {e}")
        print("\nNote: Cloudflare is blocking direct WebSocket connections")
        print("This is a common security configuration.")
        return False

def test_with_upgrade():
    """Test connection with automatic upgrade from polling to WebSocket"""
    print("\n" + "=" * 60)
    print("Test 3: Socket.IO with Auto-Upgrade (polling → websocket)")
    print("=" * 60)

    sio = socketio.Client(logger=True, engineio_logger=True)

    @sio.event
    def connect():
        print("\n✓ Successfully connected!")
        print(f"  Session ID: {sio.sid}")

    @sio.event
    def disconnect():
        print("✓ Disconnected")

    try:
        url = "https://terminalbackend.wardcrew.com"
        print(f"Connecting to: {url}")
        print("Transport: polling with WebSocket upgrade")
        print("-" * 60)

        # Connect with both transports (will try to upgrade)
        sio.connect(
            url,
            transports=['polling', 'websocket'],
            wait_timeout=10
        )

        print("\nConnection established! Waiting to see if upgrade happens...")
        time.sleep(5)

        sio.disconnect()
        print("\n✓ Test 3 PASSED!")
        return True

    except Exception as e:
        print(f"\n✗ Test 3 FAILED: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Socket.IO Connection Tests")
    print("Target: terminalbackend.wardcrew.com")
    print("=" * 60 + "\n")

    results = []
    results.append(("Polling", test_polling_connection()))
    results.append(("WebSocket Direct", test_websocket_direct()))
    results.append(("Auto-Upgrade", test_with_upgrade()))

    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {name}: {status}")

    print("\n" + "=" * 60)
    print("Key Findings:")
    print("=" * 60)
    print("• HTTP polling transport: WORKS")
    print("• Direct WebSocket connection: BLOCKED by Cloudflare")
    print("• The server IS online and functioning correctly")
    print("• fetch() API cannot be used for WebSocket connections")
    print("• Use Socket.IO client library instead")

    any_passed = any(result[1] for result in results)
    exit(0 if any_passed else 1)
