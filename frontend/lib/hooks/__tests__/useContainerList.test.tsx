import { renderHook, act, waitFor } from '@testing-library/react';
import { useContainerList } from '../useContainerList';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useContainerList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not fetch when not authenticated', () => {
    renderHook(() => useContainerList(false));

    expect(mockApiClient.getContainers).not.toHaveBeenCalled();
  });

  it('should fetch containers when authenticated', async () => {
    const mockContainers = [
      { id: '1', name: 'container1', image: 'nginx', status: 'running', uptime: '1h' },
      { id: '2', name: 'container2', image: 'redis', status: 'stopped', uptime: '0m' },
    ];

    mockApiClient.getContainers.mockResolvedValueOnce(mockContainers);

    const { result } = renderHook(() => useContainerList(true));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.containers).toEqual(mockContainers);
    });

    expect(mockApiClient.getContainers).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('should handle fetch error', async () => {
    mockApiClient.getContainers.mockRejectedValueOnce(new Error('Fetch failed'));

    const { result } = renderHook(() => useContainerList(true));

    await waitFor(() => {
      expect(result.current.error).toBe('Fetch failed');
    });

    expect(result.current.containers).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle non-Error objects', async () => {
    mockApiClient.getContainers.mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useContainerList(true));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch containers');
    });
  });

  it('should refresh automatically every 10 seconds', async () => {
    const mockContainers = [{ id: '1', name: 'test', image: 'nginx', status: 'running', uptime: '1h' }];
    mockApiClient.getContainers.mockResolvedValue(mockContainers);

    renderHook(() => useContainerList(true));

    await waitFor(() => {
      expect(mockApiClient.getContainers).toHaveBeenCalledTimes(1);
    });

    // Advance 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(mockApiClient.getContainers).toHaveBeenCalledTimes(2);
    });

    // Advance another 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(mockApiClient.getContainers).toHaveBeenCalledTimes(3);
    });
  });

  it('should manually refresh containers', async () => {
    const mockContainers = [{ id: '1', name: 'test', image: 'nginx', status: 'running', uptime: '1h' }];
    mockApiClient.getContainers.mockResolvedValue(mockContainers);

    const { result } = renderHook(() => useContainerList(true));

    await waitFor(() => {
      expect(mockApiClient.getContainers).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    await act(async () => {
      await result.current.refreshContainers();
    });

    expect(mockApiClient.getContainers).toHaveBeenCalledTimes(2);
  });

  it('should set isRefreshing during manual refresh', async () => {
    let resolveGet: (value: any) => void;
    const getPromise = new Promise((resolve) => {
      resolveGet = resolve;
    });

    mockApiClient.getContainers.mockReturnValue(getPromise as any);

    const { result } = renderHook(() => useContainerList(true));

    act(() => {
      result.current.refreshContainers();
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(true);
    });

    await act(async () => {
      resolveGet!([]);
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
  });

  it('should cleanup interval on unmount', async () => {
    const mockContainers = [{ id: '1', name: 'test', image: 'nginx', status: 'running', uptime: '1h' }];
    mockApiClient.getContainers.mockResolvedValue(mockContainers);

    const { unmount } = renderHook(() => useContainerList(true));

    await waitFor(() => {
      expect(mockApiClient.getContainers).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Advance timers - should not fetch again after unmount
    act(() => {
      jest.advanceTimersByTime(20000);
    });

    // Should still be 1 call (the initial one)
    expect(mockApiClient.getContainers).toHaveBeenCalledTimes(1);
  });

  it('should re-fetch when authentication changes', async () => {
    const mockContainers = [{ id: '1', name: 'test', image: 'nginx', status: 'running', uptime: '1h' }];
    mockApiClient.getContainers.mockResolvedValue(mockContainers);

    const { rerender } = renderHook(({ isAuth }) => useContainerList(isAuth), {
      initialProps: { isAuth: false },
    });

    expect(mockApiClient.getContainers).not.toHaveBeenCalled();

    rerender({ isAuth: true });

    await waitFor(() => {
      expect(mockApiClient.getContainers).toHaveBeenCalledTimes(1);
    });
  });
});
