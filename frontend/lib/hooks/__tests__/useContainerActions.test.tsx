import { renderHook, act, waitFor } from '@testing-library/react';
import { useContainerActions } from '../useContainerActions';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useContainerActions', () => {
  const containerId = 'container123';
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleStart', () => {
    it('should start container and show success', async () => {
      mockApiClient.startContainer.mockResolvedValueOnce({ message: 'Started' });

      const { result } = renderHook(() => useContainerActions(containerId, mockOnUpdate));

      await act(async () => {
        await result.current.handleStart();
      });

      expect(mockApiClient.startContainer).toHaveBeenCalledWith(containerId);
      expect(mockOnUpdate).toHaveBeenCalled();
      expect(result.current.snackbar.open).toBe(true);
      expect(result.current.snackbar.message).toBe('Container started successfully');
      expect(result.current.snackbar.severity).toBe('success');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle start error', async () => {
      mockApiClient.startContainer.mockRejectedValueOnce(new Error('Start failed'));

      const { result } = renderHook(() => useContainerActions(containerId, mockOnUpdate));

      await act(async () => {
        await result.current.handleStart();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(result.current.snackbar.severity).toBe('error');
      expect(result.current.snackbar.message).toContain('Failed to start');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('handleStop', () => {
    it('should stop container and show success', async () => {
      mockApiClient.stopContainer.mockResolvedValueOnce({ message: 'Stopped' });

      const { result } = renderHook(() => useContainerActions(containerId, mockOnUpdate));

      await act(async () => {
        await result.current.handleStop();
      });

      expect(mockApiClient.stopContainer).toHaveBeenCalledWith(containerId);
      expect(mockOnUpdate).toHaveBeenCalled();
      expect(result.current.snackbar.message).toBe('Container stopped successfully');
    });

    it('should handle stop error', async () => {
      mockApiClient.stopContainer.mockRejectedValueOnce(new Error('Stop failed'));

      const { result } = renderHook(() => useContainerActions(containerId));

      await act(async () => {
        await result.current.handleStop();
      });

      expect(result.current.snackbar.severity).toBe('error');
    });
  });

  describe('handleRestart', () => {
    it('should restart container and show success', async () => {
      mockApiClient.restartContainer.mockResolvedValueOnce({ message: 'Restarted' });

      const { result } = renderHook(() => useContainerActions(containerId, mockOnUpdate));

      await act(async () => {
        await result.current.handleRestart();
      });

      expect(mockApiClient.restartContainer).toHaveBeenCalledWith(containerId);
      expect(result.current.snackbar.message).toBe('Container restarted successfully');
    });

    it('should handle restart error', async () => {
      mockApiClient.restartContainer.mockRejectedValueOnce(new Error('Restart failed'));

      const { result } = renderHook(() => useContainerActions(containerId));

      await act(async () => {
        await result.current.handleRestart();
      });

      expect(result.current.snackbar.severity).toBe('error');
    });
  });

  describe('handleRemove', () => {
    it('should remove container and show success', async () => {
      mockApiClient.removeContainer.mockResolvedValueOnce({ message: 'Removed' });

      const { result } = renderHook(() => useContainerActions(containerId, mockOnUpdate));

      await act(async () => {
        await result.current.handleRemove();
      });

      expect(mockApiClient.removeContainer).toHaveBeenCalledWith(containerId);
      expect(result.current.snackbar.message).toBe('Container removed successfully');
    });

    it('should handle remove error', async () => {
      mockApiClient.removeContainer.mockRejectedValueOnce(new Error('Remove failed'));

      const { result } = renderHook(() => useContainerActions(containerId));

      await act(async () => {
        await result.current.handleRemove();
      });

      expect(result.current.snackbar.severity).toBe('error');
      expect(result.current.snackbar.message).toContain('Failed to remove');
    });
  });

  describe('closeSnackbar', () => {
    it('should close snackbar', async () => {
      mockApiClient.startContainer.mockResolvedValueOnce({ message: 'Started' });

      const { result } = renderHook(() => useContainerActions(containerId));

      await act(async () => {
        await result.current.handleStart();
      });

      expect(result.current.snackbar.open).toBe(true);

      act(() => {
        result.current.closeSnackbar();
      });

      expect(result.current.snackbar.open).toBe(false);
    });
  });

  describe('loading state', () => {
    it('should set loading during operation', async () => {
      let resolveStart: (value: any) => void;
      const startPromise = new Promise((resolve) => {
        resolveStart = resolve;
      });

      mockApiClient.startContainer.mockReturnValue(startPromise as any);

      const { result } = renderHook(() => useContainerActions(containerId));

      act(() => {
        result.current.handleStart();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveStart!({ message: 'Started' });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  it('should handle non-Error objects in catch block', async () => {
    mockApiClient.startContainer.mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useContainerActions(containerId));

    await act(async () => {
      await result.current.handleStart();
    });

    expect(result.current.snackbar.message).toContain('Unknown error');
  });
});
