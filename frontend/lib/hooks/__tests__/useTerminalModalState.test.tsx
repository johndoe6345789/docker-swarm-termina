import { renderHook, act } from '@testing-library/react';
import { useTerminalModalState } from '../useTerminalModalState';

// Suppress console.warn during tests (fallback mode warnings are expected)
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

// Mock MUI hooks
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useTheme: () => ({
    breakpoints: {
      down: () => {},
    },
  }),
  useMediaQuery: () => false,
}));

describe('useTerminalModalState', () => {
  it('should initialize with interactive mode', () => {
    const { result } = renderHook(() => useTerminalModalState());

    expect(result.current.mode).toBe('interactive');
    expect(result.current.interactiveFailed).toBe(false);
    expect(result.current.fallbackReason).toBe('');
    expect(result.current.showFallbackNotification).toBe(false);
  });

  it('should handle fallback to simple mode', () => {
    const { result } = renderHook(() => useTerminalModalState());

    act(() => {
      result.current.handleFallback('Connection failed');
    });

    expect(result.current.mode).toBe('simple');
    expect(result.current.interactiveFailed).toBe(true);
    expect(result.current.fallbackReason).toBe('Connection failed');
  });

  it('should handle mode change', () => {
    const { result } = renderHook(() => useTerminalModalState());

    const mockEvent = {} as React.MouseEvent<HTMLElement>;

    act(() => {
      result.current.handleModeChange(mockEvent, 'simple');
    });

    expect(result.current.mode).toBe('simple');
  });

  it('should ignore null mode change', () => {
    const { result } = renderHook(() => useTerminalModalState());

    const mockEvent = {} as React.MouseEvent<HTMLElement>;

    act(() => {
      result.current.handleModeChange(mockEvent, null);
    });

    expect(result.current.mode).toBe('interactive');
  });

  it('should clear failure state when switching to interactive after failure', () => {
    const { result } = renderHook(() => useTerminalModalState());

    const mockEvent = {} as React.MouseEvent<HTMLElement>;

    // First, trigger fallback
    act(() => {
      result.current.handleFallback('Error');
    });

    expect(result.current.interactiveFailed).toBe(true);

    // Then switch back to interactive
    act(() => {
      result.current.handleModeChange(mockEvent, 'interactive');
    });

    expect(result.current.mode).toBe('interactive');
    expect(result.current.interactiveFailed).toBe(false);
    expect(result.current.fallbackReason).toBe('');
  });

  it('should handle retry interactive', () => {
    const { result } = renderHook(() => useTerminalModalState());

    // First, trigger fallback
    act(() => {
      result.current.handleFallback('Connection timeout');
    });

    // Then retry
    act(() => {
      result.current.handleRetryInteractive();
    });

    expect(result.current.mode).toBe('interactive');
    expect(result.current.interactiveFailed).toBe(false);
    expect(result.current.fallbackReason).toBe('');
    expect(result.current.showFallbackNotification).toBe(false);
  });

  it('should reset all state', () => {
    const { result } = renderHook(() => useTerminalModalState());

    // Set some state
    act(() => {
      result.current.handleFallback('Error');
    });

    expect(result.current.mode).toBe('simple');

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.mode).toBe('interactive');
    expect(result.current.interactiveFailed).toBe(false);
    expect(result.current.fallbackReason).toBe('');
    expect(result.current.showFallbackNotification).toBe(false);
  });

  it('should handle mobile detection', () => {
    const { result } = renderHook(() => useTerminalModalState());

    expect(result.current.isMobile).toBe(false);
  });

  describe('handler stability (useCallback memoization)', () => {
    it('should return stable handleFallback reference across renders', () => {
      const { result, rerender } = renderHook(() => useTerminalModalState());

      const firstHandleFallback = result.current.handleFallback;

      // Trigger a re-render
      rerender();

      const secondHandleFallback = result.current.handleFallback;

      // Handler should be the same reference (memoized with useCallback)
      expect(firstHandleFallback).toBe(secondHandleFallback);
    });

    it('should return stable handleModeChange reference across renders', () => {
      const { result, rerender } = renderHook(() => useTerminalModalState());

      const firstHandler = result.current.handleModeChange;

      rerender();

      const secondHandler = result.current.handleModeChange;

      expect(firstHandler).toBe(secondHandler);
    });

    it('should return stable handleRetryInteractive reference across renders', () => {
      const { result, rerender } = renderHook(() => useTerminalModalState());

      const firstHandler = result.current.handleRetryInteractive;

      rerender();

      const secondHandler = result.current.handleRetryInteractive;

      expect(firstHandler).toBe(secondHandler);
    });

    it('should return stable reset reference across renders', () => {
      const { result, rerender } = renderHook(() => useTerminalModalState());

      const firstHandler = result.current.reset;

      rerender();

      const secondHandler = result.current.reset;

      expect(firstHandler).toBe(secondHandler);
    });

    it('should maintain handler stability even after state changes', () => {
      const { result, rerender } = renderHook(() => useTerminalModalState());

      const firstHandleFallback = result.current.handleFallback;

      // Trigger state change
      act(() => {
        result.current.handleFallback('Test error');
      });

      rerender();

      // Handler should still be the same reference
      expect(result.current.handleFallback).toBe(firstHandleFallback);
    });
  });
});
