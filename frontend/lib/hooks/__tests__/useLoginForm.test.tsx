import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/store/authSlice';
import { useLoginForm } from '../useLoginForm';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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
});
