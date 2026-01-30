import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  initAuth,
  setUnauthenticated,
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

  describe('setUnauthenticated', () => {
    it('sets auth state to unauthenticated', () => {
      store.dispatch(setUnauthenticated());
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
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

    it('handles login failure', async () => {
      (apiClient.apiClient.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      await store.dispatch(login({ username: 'testuser', password: 'wrong' }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.username).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
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
  });
});
