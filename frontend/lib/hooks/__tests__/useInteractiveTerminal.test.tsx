import { renderHook, act } from '@testing-library/react';
import { useInteractiveTerminal } from '../useInteractiveTerminal';

type UseInteractiveTerminalProps = {
  open: boolean;
  containerId: string;
  containerName: string;
  isMobile: boolean;
  onFallback: (reason: string) => void;
};

// Suppress console output during tests (terminal initialization logs)
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock xterm
const mockTerminal = {
  loadAddon: jest.fn(),
  open: jest.fn(),
  write: jest.fn(),
  onData: jest.fn(),
  dispose: jest.fn(),
};

const mockFitAddon = {
  fit: jest.fn(),
  proposeDimensions: jest.fn(() => ({ cols: 80, rows: 24 })),
};

jest.mock('@xterm/xterm', () => ({
  Terminal: jest.fn(() => mockTerminal),
}));

jest.mock('@xterm/addon-fit', () => ({
  FitAddon: jest.fn(() => mockFitAddon),
}));

// Mock API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getToken: jest.fn(() => 'test-token'),
  },
  API_BASE_URL: 'http://localhost:3000',
}));

describe('useInteractiveTerminal', () => {
  const defaultProps = {
    open: true,
    containerId: 'container123',
    containerName: 'test-container',
    isMobile: false,
    onFallback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock socket event handlers
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    mockTerminal.dispose.mockClear();
  });

  it('should return terminalRef and cleanup function', () => {
    const { result } = renderHook(() =>
      useInteractiveTerminal(defaultProps)
    );

    expect(result.current.terminalRef).toBeDefined();
    expect(typeof result.current.cleanup).toBe('function');
  });

  it('should not initialize terminal when open is false', async () => {
    const { io } = require('socket.io-client');

    renderHook(() =>
      useInteractiveTerminal({
        ...defaultProps,
        open: false,
      })
    );

    // Wait for potential async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(io).not.toHaveBeenCalled();
  });

  describe('effect dependency stability', () => {
    it('should re-initialize when onFallback reference changes (demonstrates the bug this fix prevents)', async () => {
      const { io } = require('socket.io-client');

      // Create a ref div for the terminal
      const mockDiv = document.createElement('div');

      const { rerender } = renderHook(
        (props: UseInteractiveTerminalProps) => {
          const hook = useInteractiveTerminal(props);
          // Simulate ref being available
          if (hook.terminalRef.current === null) {
            (hook.terminalRef as any).current = mockDiv;
          }
          return hook;
        },
        {
          initialProps: {
            ...defaultProps,
            onFallback: jest.fn(), // First callback instance
          },
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const initialCallCount = io.mock.calls.length;

      // Rerender with a NEW function reference (simulating unstable callback)
      // This WILL cause re-init because onFallback is in the dependency array
      // The fix is in useTerminalModalState which now memoizes handleFallback
      rerender({
        ...defaultProps,
        onFallback: jest.fn(), // New callback instance
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const finalCallCount = io.mock.calls.length;

      // This test DOCUMENTS that unstable onFallback causes re-initialization
      // The actual fix ensures onFallback from useTerminalModalState is stable
      expect(finalCallCount).toBeGreaterThan(initialCallCount);
    });

    it('should only re-initialize when open, containerId, or isMobile changes', async () => {
      const { io } = require('socket.io-client');
      const stableOnFallback = jest.fn();

      const mockDiv = document.createElement('div');

      const { rerender } = renderHook(
        (props) => {
          const hook = useInteractiveTerminal(props);
          if (hook.terminalRef.current === null) {
            (hook.terminalRef as any).current = mockDiv;
          }
          return hook;
        },
        {
          initialProps: {
            ...defaultProps,
            onFallback: stableOnFallback,
          },
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const initialCallCount = io.mock.calls.length;

      // Rerender with same props (stable reference)
      rerender({
        ...defaultProps,
        onFallback: stableOnFallback, // Same reference
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Should NOT reinitialize with same props
      expect(io.mock.calls.length).toBe(initialCallCount);
    });

    it('should re-initialize when containerId changes', async () => {
      const { io } = require('socket.io-client');
      const stableOnFallback = jest.fn();

      const mockDiv = document.createElement('div');

      const { rerender } = renderHook(
        (props) => {
          const hook = useInteractiveTerminal(props);
          if (hook.terminalRef.current === null) {
            (hook.terminalRef as any).current = mockDiv;
          }
          return hook;
        },
        {
          initialProps: {
            ...defaultProps,
            onFallback: stableOnFallback,
          },
        }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const initialCallCount = io.mock.calls.length;

      // Rerender with different containerId
      rerender({
        ...defaultProps,
        containerId: 'different-container',
        onFallback: stableOnFallback,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // SHOULD reinitialize with new containerId
      expect(io.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should cleanup on unmount', async () => {
    const mockDiv = document.createElement('div');

    const { unmount } = renderHook(
      () => {
        const hook = useInteractiveTerminal(defaultProps);
        if (hook.terminalRef.current === null) {
          (hook.terminalRef as any).current = mockDiv;
        }
        return hook;
      }
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    unmount();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verify cleanup was called
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should call cleanup function when invoked manually', () => {
    const { result } = renderHook(() => useInteractiveTerminal(defaultProps));

    act(() => {
      result.current.cleanup();
    });

    // Manual cleanup should work without errors
    expect(result.current.cleanup).toBeDefined();
  });
});

describe('useInteractiveTerminal reconnection loop detection', () => {
  const testProps = {
    open: true,
    containerId: 'container123',
    containerName: 'test-container',
    isMobile: false,
    onFallback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not create multiple connections in rapid succession with stable props', async () => {
    const { io } = require('socket.io-client');
    const mockDiv = document.createElement('div');

    // Track connection timing
    const connectionTimes: number[] = [];
    io.mockImplementation(() => {
      connectionTimes.push(Date.now());
      return mockSocket;
    });

    const stableOnFallback = jest.fn();

    const { rerender } = renderHook(
      (props) => {
        const hook = useInteractiveTerminal(props);
        if (hook.terminalRef.current === null) {
          (hook.terminalRef as any).current = mockDiv;
        }
        return hook;
      },
      {
        initialProps: {
          ...testProps,
          onFallback: stableOnFallback,
        },
      }
    );

    // Simulate multiple rapid rerenders (like React Strict Mode or state updates)
    for (let i = 0; i < 5; i++) {
      rerender({
        ...testProps,
        onFallback: stableOnFallback,
      });
    }

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // With stable props, should only have 1 connection (initial mount)
    // A reconnection loop would show multiple connections
    expect(connectionTimes.length).toBeLessThanOrEqual(2); // Allow for initial + StrictMode double-mount
  });
});
