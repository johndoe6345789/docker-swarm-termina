import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/store/authSlice';
import { useLoginForm } from '../useLoginForm';
import { apiClient } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    getToken: jest.fn(),
    getContainers: jest.fn(),
  },
}));

const createMockStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={createMockStore()}>{children}</Provider>
);

describe('useLoginForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('initializes with empty username and password', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    expect(result.current.username).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('updates username when setUsername is called', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    act(() => {
      result.current.setUsername('testuser');
    });

    expect(result.current.username).toBe('testuser');
  });

  it('updates password when setPassword is called', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    act(() => {
      result.current.setPassword('testpass');
    });

    expect(result.current.password).toBe('testpass');
  });

  it('handles form submission', async () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });
    const mockEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.FormEvent;

    act(() => {
      result.current.setUsername('testuser');
      result.current.setPassword('testpass');
    });

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('returns loading state', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    expect(result.current.loading).toBeDefined();
  });

  it('returns isShaking state', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    expect(result.current.isShaking).toBe(false);
  });

  it('navigates to dashboard on successful login', async () => {
    (apiClient.login as jest.Mock).mockResolvedValue({
      success: true,
      token: 'test-token',
      username: 'testuser',
    });

    const { result } = renderHook(() => useLoginForm(), { wrapper });
    const mockEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.FormEvent;

    act(() => {
      result.current.setUsername('testuser');
      result.current.setPassword('password123');
    });

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('sets isShaking on failed login', async () => {
    jest.useFakeTimers();

    (apiClient.login as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
    });

    const { result } = renderHook(() => useLoginForm(), { wrapper });
    const mockEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.FormEvent;

    act(() => {
      result.current.setUsername('testuser');
      result.current.setPassword('wrongpassword');
    });

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.isShaking).toBe(true);
    });

    // Fast-forward timer to clear isShaking
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.isShaking).toBe(false);

    jest.useRealTimers();
  });

  it('does not navigate on failed login', async () => {
    (apiClient.login as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
    });

    const { result } = renderHook(() => useLoginForm(), { wrapper });
    const mockEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.FormEvent;

    act(() => {
      result.current.setUsername('testuser');
      result.current.setPassword('wrongpassword');
    });

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
