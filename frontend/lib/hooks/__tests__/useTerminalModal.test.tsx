import { renderHook, act } from '@testing-library/react';
import { useTerminalModal } from '../useTerminalModal';

describe('useTerminalModal', () => {
  it('initializes with modal closed and no container selected', () => {
    const { result } = renderHook(() => useTerminalModal());

    expect(result.current.isTerminalOpen).toBe(false);
    expect(result.current.selectedContainer).toBeNull();
  });

  it('opens modal with selected container', () => {
    const { result } = renderHook(() => useTerminalModal());
    const mockContainer = { id: '123', name: 'test-container' } as any;

    act(() => {
      result.current.openTerminal(mockContainer);
    });

    expect(result.current.isTerminalOpen).toBe(true);
    expect(result.current.selectedContainer).toEqual(mockContainer);
  });

  it('closes modal and eventually clears selected container', async () => {
    const { result } = renderHook(() => useTerminalModal());
    const mockContainer = { id: '123', name: 'test-container' } as any;

    act(() => {
      result.current.openTerminal(mockContainer);
    });

    expect(result.current.isTerminalOpen).toBe(true);

    act(() => {
      result.current.closeTerminal();
    });

    expect(result.current.isTerminalOpen).toBe(false);
  });

  it('handles multiple open and close cycles', () => {
    const { result } = renderHook(() => useTerminalModal());
    const container1 = { id: '123', name: 'container1' } as any;
    const container2 = { id: '456', name: 'container2' } as any;

    act(() => {
      result.current.openTerminal(container1);
    });
    expect(result.current.selectedContainer).toEqual(container1);

    act(() => {
      result.current.closeTerminal();
    });
    expect(result.current.isTerminalOpen).toBe(false);

    act(() => {
      result.current.openTerminal(container2);
    });
    expect(result.current.selectedContainer).toEqual(container2);
  });
});
