import { renderHook, waitFor } from '@testing-library/react';
import { useInteractiveTerminal } from '../useInteractiveTerminal';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock xterm
jest.mock('@xterm/xterm', () => ({
  Terminal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    write: jest.fn(),
    dispose: jest.fn(),
    onData: jest.fn(),
    loadAddon: jest.fn(),
  })),
}));

jest.mock('@xterm/addon-fit', () => ({
  FitAddon: jest.fn().mockImplementation(() => ({
    fit: jest.fn(),
    proposeDimensions: jest.fn(() => ({ cols: 80, rows: 24 })),
  })),
}));

// Mock API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getToken: jest.fn(() => 'mock-token'),
  },
  API_BASE_URL: 'http://localhost:5000',
}));

describe('useInteractiveTerminal', () => {
  let mockSocket: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock socket
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
    };

    (io as jest.Mock).mockReturnValue(mockSocket);

    // Mock window
    Object.defineProperty(window, 'addEventListener', {
      value: jest.fn(),
      writable: true,
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: jest.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize socket.io with polling-only transport', async () => {
    const onFallback = jest.fn();

    renderHook(() =>
      useInteractiveTerminal({
        open: true,
        containerId: 'test-123',
        containerName: 'test-container',
        isMobile: false,
        onFallback,
      })
    );

    await waitFor(
      () => {
        expect(io).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Verify io was called with correct configuration
    expect(io).toHaveBeenCalledWith(
      'http://localhost:5000/terminal',
      expect.objectContaining({
        transports: ['polling'],
        reconnectionDelayMax: 10000,
        timeout: 60000,
        forceNew: true,
      })
    );
  });

  it('should NOT use websocket transport', async () => {
    const onFallback = jest.fn();

    renderHook(() =>
      useInteractiveTerminal({
        open: true,
        containerId: 'test-123',
        containerName: 'test-container',
        isMobile: false,
        onFallback,
      })
    );

    await waitFor(
      () => {
        expect(io).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    const ioCall = (io as jest.Mock).mock.calls[0];
    const config = ioCall[1];

    // Verify websocket is NOT in transports array
    expect(config.transports).not.toContain('websocket');
    expect(config.transports).toEqual(['polling']);
  });

  it('should use HTTP URL not WebSocket URL', async () => {
    const onFallback = jest.fn();

    renderHook(() =>
      useInteractiveTerminal({
        open: true,
        containerId: 'test-123',
        containerName: 'test-container',
        isMobile: false,
        onFallback,
      })
    );

    await waitFor(
      () => {
        expect(io).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    const ioCall = (io as jest.Mock).mock.calls[0];
    const url = ioCall[0];

    // Should use http:// not ws://
    expect(url).toMatch(/^http/);
    expect(url).not.toMatch(/^ws/);
    expect(url).toBe('http://localhost:5000/terminal');
  });

  it('should not initialize socket when modal is closed', () => {
    const onFallback = jest.fn();

    renderHook(() =>
      useInteractiveTerminal({
        open: false,
        containerId: 'test-123',
        containerName: 'test-container',
        isMobile: false,
        onFallback,
      })
    );

    // Socket.IO should not be initialized
    expect(io).not.toHaveBeenCalled();
  });

  it('should register all required socket event handlers', async () => {
    const onFallback = jest.fn();

    renderHook(() =>
      useInteractiveTerminal({
        open: true,
        containerId: 'test-123',
        containerName: 'test-container',
        isMobile: false,
        onFallback,
      })
    );

    await waitFor(
      () => {
        expect(mockSocket.on).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Verify all event handlers are registered
    const eventNames = (mockSocket.on as jest.Mock).mock.calls.map(
      (call) => call[0]
    );

    expect(eventNames).toContain('connect');
    expect(eventNames).toContain('connect_error');
    expect(eventNames).toContain('started');
    expect(eventNames).toContain('output');
    expect(eventNames).toContain('error');
    expect(eventNames).toContain('exit');
    expect(eventNames).toContain('disconnect');
  });

  it('should cleanup socket on unmount', async () => {
    const onFallback = jest.fn();

    const { unmount } = renderHook(() =>
      useInteractiveTerminal({
        open: true,
        containerId: 'test-123',
        containerName: 'test-container',
        isMobile: false,
        onFallback,
      })
    );

    await waitFor(
      () => {
        expect(io).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    unmount();

    await waitFor(() => {
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});
