import { renderHook } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/store/authSlice';
import { useAuthRedirect } from '../useAuthRedirect';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const createMockStore = (isAuthenticated: boolean, loading = false) =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated,
        loading,
        username: isAuthenticated ? 'testuser' : null,
        error: null,
      },
    },
  });

describe('useAuthRedirect', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('redirects to dashboard when authenticated and redirectTo is dashboard', () => {
    const store = createMockStore(true);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => useAuthRedirect('/dashboard'), { wrapper });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to login when not authenticated and redirectTo is /', () => {
    const store = createMockStore(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => useAuthRedirect('/'), { wrapper });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('does not redirect when authenticated but redirectTo is /', () => {
    const store = createMockStore(true);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => useAuthRedirect('/'), { wrapper });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not redirect when loading is true', () => {
    const store = createMockStore(false, true);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => useAuthRedirect('/dashboard'), { wrapper });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
