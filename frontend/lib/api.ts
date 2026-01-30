import { triggerAuthError } from './store/authErrorHandler';

export const API_BASE_URL =
  typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_API_URL
    ? (window as any).__ENV__.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  uptime: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  username?: string;
  message?: string;
}

export interface ContainersResponse {
  containers: Container[];
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.success && data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    this.setToken(null);
  }

  async getContainers(): Promise<Container[]> {
    const token = this.getToken();
    if (!token) {
      triggerAuthError();
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/containers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        triggerAuthError();
        throw new Error('Session expired');
      }
      throw new Error('Failed to fetch containers');
    }

    const data: ContainersResponse = await response.json();
    return data.containers;
  }

  async executeCommand(containerId: string, command: string): Promise<any> {
    const token = this.getToken();
    if (!token) {
      triggerAuthError();
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/containers/${containerId}/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        triggerAuthError();
      }
      throw new Error('Failed to execute command');
    }

    return response.json();
  }

  async startContainer(containerId: string): Promise<any> {
    const token = this.getToken();
    if (!token) {
      triggerAuthError();
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/containers/${containerId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        triggerAuthError();
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to start container');
    }

    return response.json();
  }

  async stopContainer(containerId: string): Promise<any> {
    const token = this.getToken();
    if (!token) {
      triggerAuthError();
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/containers/${containerId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        triggerAuthError();
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop container');
    }

    return response.json();
  }

  async restartContainer(containerId: string): Promise<any> {
    const token = this.getToken();
    if (!token) {
      triggerAuthError();
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/containers/${containerId}/restart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        triggerAuthError();
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to restart container');
    }

    return response.json();
  }

  async removeContainer(containerId: string): Promise<any> {
    const token = this.getToken();
    if (!token) {
      triggerAuthError();
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/containers/${containerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        triggerAuthError();
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove container');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
