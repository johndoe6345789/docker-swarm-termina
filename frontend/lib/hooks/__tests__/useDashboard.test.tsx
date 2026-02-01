import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboard } from '../useDashboard';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/store/hooks';
import { useAuthRedirect } from '../useAuthRedirect';
import { useContainerList } from '../useContainerList';
import { useTerminalModal } from '../useTerminalModal';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock MUI
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useTheme: () => ({
    breakpoints: {
      down: () => {},
    },
  }),
  useMediaQuery: jest.fn(),
}));

// Mock Redux
jest.mock('@/lib/store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock other hooks
jest.mock('../useAuthRedirect');
jest.mock('../useContainerList');
jest.mock('../useTerminalModal');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

const mockDispatch = jest.fn();

describe('useDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Default mock implementations
    (useAuthRedirect as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useContainerList as jest.Mock).mockReturnValue({
      containers: [],
      isRefreshing: false,
      isLoading: false,
      error: '',
      refreshContainers: jest.fn(),
    });

    (useTerminalModal as jest.Mock).mockReturnValue({
      selectedContainer: null,
      isTerminalOpen: false,
      openTerminal: jest.fn(),
      closeTerminal: jest.fn(),
    });

    const { useMediaQuery } = require('@mui/material');
    (useMediaQuery as jest.Mock).mockReturnValue(false);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.authLoading).toBe(false);
    expect(result.current.containers).toEqual([]);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.selectedContainer).toBeNull();
    expect(result.current.isTerminalOpen).toBe(false);
    expect(result.current.isMobile).toBe(false);
  });

  it('should calculate isInitialLoading correctly', () => {
    (useAuthRedirect as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: true,
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.isInitialLoading).toBe(true);
  });

  it('should calculate isInitialLoading when containers are loading', () => {
    (useContainerList as jest.Mock).mockReturnValue({
      containers: [],
      isRefreshing: false,
      isLoading: true,
      error: '',
      refreshContainers: jest.fn(),
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.isInitialLoading).toBe(true);
  });

  it('should calculate hasContainers correctly', () => {
    const mockContainers = [
      { id: '1', name: 'container1', image: 'nginx', status: 'running', uptime: '1h' },
    ];

    (useContainerList as jest.Mock).mockReturnValue({
      containers: mockContainers,
      isRefreshing: false,
      isLoading: false,
      error: '',
      refreshContainers: jest.fn(),
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.hasContainers).toBe(true);
    expect(result.current.containers).toEqual(mockContainers);
  });

  it('should calculate showEmptyState correctly', () => {
    (useAuthRedirect as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useContainerList as jest.Mock).mockReturnValue({
      containers: [],
      isRefreshing: false,
      isLoading: false,
      error: '',
      refreshContainers: jest.fn(),
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.showEmptyState).toBe(true);
  });

  it('should not show empty state when loading', () => {
    (useContainerList as jest.Mock).mockReturnValue({
      containers: [],
      isRefreshing: false,
      isLoading: true,
      error: '',
      refreshContainers: jest.fn(),
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.showEmptyState).toBe(false);
  });

  it('should handle logout', async () => {
    mockDispatch.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('should expose refreshContainers', () => {
    const mockRefresh = jest.fn();

    (useContainerList as jest.Mock).mockReturnValue({
      containers: [],
      isRefreshing: false,
      isLoading: false,
      error: '',
      refreshContainers: mockRefresh,
    });

    const { result } = renderHook(() => useDashboard());

    result.current.refreshContainers();

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should expose terminal modal functions', () => {
    const mockOpen = jest.fn();
    const mockClose = jest.fn();
    const mockContainer = { id: '1', name: 'test', image: 'nginx', status: 'running', uptime: '1h' };

    (useTerminalModal as jest.Mock).mockReturnValue({
      selectedContainer: mockContainer,
      isTerminalOpen: true,
      openTerminal: mockOpen,
      closeTerminal: mockClose,
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.selectedContainer).toEqual(mockContainer);
    expect(result.current.isTerminalOpen).toBe(true);

    result.current.openTerminal(mockContainer);
    expect(mockOpen).toHaveBeenCalledWith(mockContainer);

    result.current.closeTerminal();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should detect mobile correctly', () => {
    const { useMediaQuery } = require('@mui/material');
    (useMediaQuery as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.isMobile).toBe(true);
  });

  it('should pass isAuthenticated to useContainerList', () => {
    (useAuthRedirect as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    renderHook(() => useDashboard());

    expect(useContainerList).toHaveBeenCalledWith(true);
  });

  it('should handle error state from container list', () => {
    (useContainerList as jest.Mock).mockReturnValue({
      containers: [],
      isRefreshing: false,
      isLoading: false,
      error: 'Failed to fetch containers',
      refreshContainers: jest.fn(),
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.error).toBe('Failed to fetch containers');
  });

  it('should handle refreshing state', () => {
    (useContainerList as jest.Mock).mockReturnValue({
      containers: [],
      isRefreshing: true,
      isLoading: false,
      error: '',
      refreshContainers: jest.fn(),
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.isRefreshing).toBe(true);
  });
});
