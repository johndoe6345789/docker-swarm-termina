import { apiClient, API_BASE_URL } from '../api';
import { triggerAuthError } from '../store/authErrorHandler';

// Mock the auth error handler
jest.mock('../store/authErrorHandler', () => ({
  triggerAuthError: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ApiClient', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks
    localStorageMock.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();

    // Reset token state
    apiClient.setToken(null);
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      apiClient.setToken('test-token');
      expect(apiClient.getToken()).toBe('test-token');
      expect(localStorageMock.getItem('auth_token')).toBe('test-token');
    });

    it('should remove token when set to null', () => {
      apiClient.setToken('test-token');
      apiClient.setToken(null);
      expect(apiClient.getToken()).toBeNull();
      expect(localStorageMock.getItem('auth_token')).toBeNull();
    });

    it('should retrieve token from localStorage', () => {
      localStorageMock.setItem('auth_token', 'stored-token');
      expect(apiClient.getToken()).toBe('stored-token');
    });

    it('should set and get username', () => {
      apiClient.setUsername('testuser');
      expect(apiClient.getUsername()).toBe('testuser');
      expect(localStorageMock.getItem('auth_username')).toBe('testuser');
    });

    it('should remove username when set to null', () => {
      apiClient.setUsername('testuser');
      apiClient.setUsername(null);
      expect(apiClient.getUsername()).toBeNull();
      expect(localStorageMock.getItem('auth_username')).toBeNull();
    });

    it('should remove username when token is set to null', () => {
      apiClient.setToken('test-token');
      apiClient.setUsername('testuser');
      apiClient.setToken(null);
      expect(localStorageMock.getItem('auth_username')).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        success: true,
        token: 'new-token',
        username: 'testuser',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await apiClient.login('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        }
      );

      expect(result).toEqual(mockResponse);
      expect(apiClient.getToken()).toBe('new-token');
      expect(apiClient.getUsername()).toBe('testuser');
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await apiClient.login('testuser', 'wrongpassword');

      expect(result).toEqual(mockResponse);
      expect(apiClient.getToken()).toBeNull();
    });

    it('should use provided username if not in response', async () => {
      const mockResponse = {
        success: true,
        token: 'new-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      await apiClient.login('testuser', 'password123');
      expect(apiClient.getUsername()).toBe('testuser');
    });
  });

  describe('logout', () => {
    it('should logout and clear token', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({});

      await apiClient.logout();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/auth/logout`,
        {
          method: 'POST',
          headers: { 'Authorization': 'Bearer test-token' },
        }
      );

      expect(apiClient.getToken()).toBeNull();
    });

    it('should clear token even if no token exists', async () => {
      await apiClient.logout();
      expect(apiClient.getToken()).toBeNull();
    });
  });

  describe('getContainers', () => {
    it('should fetch containers successfully', async () => {
      apiClient.setToken('test-token');

      const mockContainers = [
        { id: '1', name: 'container1', image: 'nginx', status: 'running', uptime: '1h' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ containers: mockContainers }),
      });

      const result = await apiClient.getContainers();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/containers`,
        {
          headers: { 'Authorization': 'Bearer test-token' },
        }
      );

      expect(result).toEqual(mockContainers);
    });

    it('should throw error if not authenticated', async () => {
      await expect(apiClient.getContainers()).rejects.toThrow('Not authenticated');
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle 401 response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(apiClient.getContainers()).rejects.toThrow('Session expired');
      expect(apiClient.getToken()).toBeNull();
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle other errors', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(apiClient.getContainers()).rejects.toThrow('Failed to fetch containers');
    });
  });

  describe('executeCommand', () => {
    it('should execute command successfully', async () => {
      apiClient.setToken('test-token');

      const mockResponse = { output: 'command output', workdir: '/app' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.executeCommand('container123', 'ls -la');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/containers/container123/exec`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command: 'ls -la' }),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error if not authenticated', async () => {
      await expect(apiClient.executeCommand('container123', 'ls')).rejects.toThrow('Not authenticated');
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle 401 response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(apiClient.executeCommand('container123', 'ls')).rejects.toThrow('Session expired');
      expect(apiClient.getToken()).toBeNull();
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle other errors', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(apiClient.executeCommand('container123', 'ls')).rejects.toThrow('Failed to execute command');
    });
  });

  describe('startContainer', () => {
    it('should start container successfully', async () => {
      apiClient.setToken('test-token');

      const mockResponse = { message: 'Container started' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.startContainer('container123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/containers/container123/start`,
        {
          method: 'POST',
          headers: { 'Authorization': 'Bearer test-token' },
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error if not authenticated', async () => {
      await expect(apiClient.startContainer('container123')).rejects.toThrow('Not authenticated');
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle 401 response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(apiClient.startContainer('container123')).rejects.toThrow('Session expired');
      expect(apiClient.getToken()).toBeNull();
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle error response with custom message', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Container already started' }),
      });

      await expect(apiClient.startContainer('container123')).rejects.toThrow('Container already started');
    });

    it('should use default error message if no custom message', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(apiClient.startContainer('container123')).rejects.toThrow('Failed to start container');
    });
  });

  describe('stopContainer', () => {
    it('should stop container successfully', async () => {
      apiClient.setToken('test-token');

      const mockResponse = { message: 'Container stopped' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.stopContainer('container123');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error if not authenticated', async () => {
      await expect(apiClient.stopContainer('container123')).rejects.toThrow('Not authenticated');
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle 401 response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(apiClient.stopContainer('container123')).rejects.toThrow('Session expired');
      expect(apiClient.getToken()).toBeNull();
    });

    it('should handle error response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Container not running' }),
      });

      await expect(apiClient.stopContainer('container123')).rejects.toThrow('Container not running');
    });
  });

  describe('restartContainer', () => {
    it('should restart container successfully', async () => {
      apiClient.setToken('test-token');

      const mockResponse = { message: 'Container restarted' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.restartContainer('container123');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error if not authenticated', async () => {
      await expect(apiClient.restartContainer('container123')).rejects.toThrow('Not authenticated');
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle 401 response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(apiClient.restartContainer('container123')).rejects.toThrow('Session expired');
      expect(apiClient.getToken()).toBeNull();
    });

    it('should handle error response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Container error' }),
      });

      await expect(apiClient.restartContainer('container123')).rejects.toThrow('Container error');
    });
  });

  describe('removeContainer', () => {
    it('should remove container successfully', async () => {
      apiClient.setToken('test-token');

      const mockResponse = { message: 'Container removed' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.removeContainer('container123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/containers/container123`,
        {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer test-token' },
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error if not authenticated', async () => {
      await expect(apiClient.removeContainer('container123')).rejects.toThrow('Not authenticated');
      expect(triggerAuthError).toHaveBeenCalled();
    });

    it('should handle 401 response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(apiClient.removeContainer('container123')).rejects.toThrow('Session expired');
      expect(apiClient.getToken()).toBeNull();
    });

    it('should handle error response', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Container is running' }),
      });

      await expect(apiClient.removeContainer('container123')).rejects.toThrow('Container is running');
    });
  });
});
