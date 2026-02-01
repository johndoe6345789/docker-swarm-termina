import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../api';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  loading: true,
  error: null,
};

// Async thunks
export const initAuth = createAsyncThunk('auth/init', async () => {
  const token = apiClient.getToken();
  if (token) {
    // Validate token by fetching containers
    try {
      await apiClient.getContainers();
      const username = apiClient.getUsername();
      return { isAuthenticated: true, username };
    } catch {
      // Token is invalid, clear it
      apiClient.setToken(null);
      return { isAuthenticated: false, username: null };
    }
  }
  return { isAuthenticated: false, username: null };
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.login(username, password);
      if (response.success) {
        return { username: response.username || username };
      }
      return rejectWithValue(response.message || 'Login failed');
    } catch {
      return rejectWithValue('Login failed. Please try again.');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await apiClient.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUnauthenticated: (state) => {
      state.isAuthenticated = false;
      state.username = null;
      apiClient.setToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      // Init auth
      .addCase(initAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.username = action.payload.username;
      })
      .addCase(initAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.username = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.username = action.payload.username;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.username = null;
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout fails, clear local state
        state.loading = false;
        state.isAuthenticated = false;
        state.username = null;
      });
  },
});

export const { clearError, setUnauthenticated } = authSlice.actions;
export default authSlice.reducer;
