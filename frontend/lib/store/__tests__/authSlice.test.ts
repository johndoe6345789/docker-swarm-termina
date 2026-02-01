import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  initAuth,
  setUnauthenticated,
  clearError,
} from '../authSlice';
import * as apiClient from '@/lib/api';

jest.mock('@/lib/api');

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        isAuthenticated: false,
        loading: true,
        username: null,
        error: null,
      });
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      // Set error first
      store.dispatch({ type: 'auth/login/rejected', payload: 'Login failed' });
      expect(store.getState().auth.error).toBeTruthy();

      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });

  describe('setUnauthenticated', () => {
    it('sets auth state to unauthenticated', () => {
      store.dispatch(setUnauthenticated());
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
    });

    it('calls apiClient.setToken with null', () => {
      store.dispatch(setUnauthenticated());
      expect(apiClient.apiClient.setToken).toHaveBeenCalledWith(null);
    });
  });

  describe('login async thunk', () => {
    it('handles successful login', async () => {
      const mockLoginResponse = { success: true, username: 'testuser' };
      (apiClient.apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await store.dispatch(login({ username: 'testuser', password: 'password' }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.username).toBe('testuser');
      expect(state.loading).toBe(false);
    });

    it('handles successful login without username in response', async () => {
      const mockLoginResponse = { success: true, token: 'test-token' };
      (apiClient.apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await store.dispatch(login({ username: 'inputuser', password: 'password' }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      // Should fall back to provided username
      expect(state.username).toBe('inputuser');
      expect(state.loading).toBe(false);
    });

    it('handles login failure with custom message', async () => {
      const mockLoginResponse = { success: false, message: 'Invalid credentials' };
      (apiClient.apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await store.dispatch(login({ username: 'testuser', password: 'wrong' }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('handles login failure without custom message', async () => {
      const mockLoginResponse = { success: false };
      (apiClient.apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await store.dispatch(login({ username: 'testuser', password: 'wrong' }));

      const state = store.getState().auth;
      expect(state.error).toBe('Login failed');
    });

    it('handles network error during login', async () => {
      (apiClient.apiClient.login as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await store.dispatch(login({ username: 'testuser', password: 'wrong' }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Login failed. Please try again.');
    });

    it('sets loading state during login', () => {
      (apiClient.apiClient.login as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(login({ username: 'testuser', password: 'password' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(true);
    });
  });

  describe('logout async thunk', () => {
    it('clears authentication state on logout', async () => {
      (apiClient.apiClient.logout as jest.Mock).mockResolvedValue({});

      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
    });

    it('clears authentication state even when logout fails', async () => {
      // First login
      store.dispatch({
        type: 'auth/login/fulfilled',
        payload: { username: 'testuser' },
      });

      (apiClient.apiClient.logout as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('initAuth async thunk', () => {
    it('restores auth state when token is valid', async () => {
      (apiClient.apiClient.getToken as jest.Mock).mockReturnValue('valid-token');
      (apiClient.apiClient.getUsername as jest.Mock).mockReturnValue('testuser');
      (apiClient.apiClient.getContainers as jest.Mock).mockResolvedValue([]);

      await store.dispatch(initAuth());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.username).toBe('testuser');
    });

    it('clears invalid token', async () => {
      (apiClient.apiClient.getToken as jest.Mock).mockReturnValue('invalid-token');
      (apiClient.apiClient.getContainers as jest.Mock).mockRejectedValue(
        new Error('Unauthorized')
      );

      await store.dispatch(initAuth());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
      expect(apiClient.apiClient.setToken).toHaveBeenCalledWith(null);
    });

    it('handles no token present', async () => {
      (apiClient.apiClient.getToken as jest.Mock).mockReturnValue(null);

      await store.dispatch(initAuth());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
    });

    it('handles initAuth rejection', async () => {
      (apiClient.apiClient.getToken as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      await store.dispatch(initAuth());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
    });
  });
});
