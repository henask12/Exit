// Auth utilities for token management and API calls

const API_BASE_URL = 'https://alphaapi-et-transitpax.azurewebsites.net/api';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenExpiresAt: string;
  user: {
    id: number;
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    station: {
      id: number;
      code: string;
      name: string;
    };
  };
}

export interface User {
  id: number;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  stationId: number;
  stationCode: string;
  stationName: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// Token storage keys
const TOKEN_KEY = 'exitcheck_token';
const REFRESH_TOKEN_KEY = 'exitcheck_refreshToken';
const USER_KEY = 'exitcheck_user';
const TOKEN_EXPIRES_AT_KEY = 'exitcheck_tokenExpiresAt';

// Token management
export const auth = {
  // Store tokens and user data
  setAuth: (data: LoginResponse) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(TOKEN_EXPIRES_AT_KEY, data.tokenExpiresAt);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
  },

  // Get access token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Get current user
  getUser: (): LoginResponse['user'] | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if token is expired or about to expire (within 5 minutes)
  isTokenExpired: (): boolean => {
    if (typeof window === 'undefined') return true;
    const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
    if (!expiresAt) return true;
    
    const expiryTime = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return (expiryTime - now) < fiveMinutes;
  },

  // Clear all auth data
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return auth.getToken() !== null && !auth.isTokenExpired();
  },
};

// API call with authentication
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token and check if it needs refresh
  let token = auth.getToken();
  
  if (token && auth.isTokenExpired()) {
    // Try to refresh token
    const refreshToken = auth.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/Auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData: LoginResponse = await refreshResponse.json();
          auth.setAuth(refreshData);
          token = refreshData.token;
        } else {
          // Refresh failed, clear auth and throw error
          auth.clearAuth();
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        auth.clearAuth();
        throw error;
      }
    } else {
      auth.clearAuth();
      throw new Error('No refresh token available');
    }
  }

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    auth.clearAuth();
    // Redirect to login if we're not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized - Please login again');
  }

  return response;
};

// Auth API functions
export const authAPI = {
  // Login
  login: async (employeeId: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeId, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Invalid employee ID or password');
    }

    const data: LoginResponse = await response.json();
    auth.setAuth(data);
    return data;
  },

  // Refresh token
  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/Auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data: LoginResponse = await response.json();
    auth.setAuth(data);
    return data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiCall('/Auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Password change failed' }));
      throw new Error(error.error || 'Password change failed');
    }

    return await response.json();
  },

  // Forgot password
  forgotPassword: async (employeeId: string, email: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeId, email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send password reset email');
    }

    return await response.json();
  },

  // Reset password
  resetPassword: async (employeeId: string, token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeId, token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Password reset failed' }));
      throw new Error(error.error || 'Password reset failed');
    }

    return await response.json();
  },

  // Test authentication
  testAuth: async (): Promise<any> => {
    const response = await apiCall('/Auth/test-auth');
    
    if (!response.ok) {
      throw new Error('Authentication test failed');
    }

    return await response.json();
  },
};

// User Management API
export const userAPI = {
  // Get all users
  getAll: async (): Promise<User[]> => {
    const response = await apiCall('/User');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return await response.json();
  },

  // Get user by ID
  getById: async (id: number): Promise<User> => {
    const response = await apiCall(`/User/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  },

  // Get current user profile
  getMe: async (): Promise<User> => {
    const response = await apiCall('/User/me');
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return await response.json();
  },

  // Create user
  create: async (userData: {
    employeeId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    stationId: number;
    roleId: number;
  }): Promise<User> => {
    const response = await apiCall('/User', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create user' }));
      throw new Error(error.error || 'Failed to create user');
    }
    return await response.json();
  },

  // Update user
  update: async (id: number, userData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    stationId?: number;
    roleId?: number;
    isActive?: boolean;
  }): Promise<User> => {
    const response = await apiCall(`/User/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update user' }));
      throw new Error(error.error || 'Failed to update user');
    }
    return await response.json();
  },

  // Delete (deactivate) user
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiCall(`/User/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to deactivate user');
    }
    return await response.json();
  },
};

// Station Management API
export interface Station {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
  isActive: boolean;
  createdAt: string;
}

export const stationAPI = {
  // Get all stations
  getAll: async (): Promise<Station[]> => {
    const response = await apiCall('/Station');
    if (!response.ok) {
      throw new Error('Failed to fetch stations');
    }
    return await response.json();
  },

  // Get station by ID
  getById: async (id: number): Promise<Station> => {
    const response = await apiCall(`/Station/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch station');
    }
    return await response.json();
  },

  // Create station
  create: async (stationData: {
    code: string;
    name: string;
    city: string;
    country: string;
  }): Promise<Station> => {
    const response = await apiCall('/Station', {
      method: 'POST',
      body: JSON.stringify(stationData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create station' }));
      throw new Error(error.error || 'Failed to create station');
    }
    return await response.json();
  },

  // Update station
  update: async (id: number, stationData: {
    code: string;
    name: string;
    city: string;
    country: string;
  }): Promise<Station> => {
    const response = await apiCall(`/Station/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stationData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update station' }));
      throw new Error(error.error || 'Failed to update station');
    }
    return await response.json();
  },

  // Delete (deactivate) station
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiCall(`/Station/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to deactivate station');
    }
    return await response.json();
  },
};

// Role & Permission Management API
export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
  isAutoGenerated?: boolean;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  permissions?: Permission[];
}

export const roleAPI = {
  // Get all roles
  getAll: async (): Promise<Role[]> => {
    const response = await apiCall('/Role');
    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }
    return await response.json();
  },

  // Get role by ID
  getById: async (id: number): Promise<Role> => {
    const response = await apiCall(`/Role/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch role');
    }
    return await response.json();
  },

  // Get all claims (permissions)
  getClaims: async (): Promise<Permission[]> => {
    const response = await apiCall('/Role/claims');
    if (!response.ok) {
      throw new Error('Failed to fetch permissions');
    }
    return await response.json();
  },

  // Create role
  create: async (roleData: {
    name: string;
    description: string;
    isAdmin: boolean;
  }): Promise<Role> => {
    const response = await apiCall('/Role', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create role' }));
      throw new Error(error.error || 'Failed to create role');
    }
    return await response.json();
  },

  // Update role
  update: async (id: number, roleData: {
    name: string;
    description: string;
    isAdmin: boolean;
  }): Promise<Role> => {
    const response = await apiCall(`/Role/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update role' }));
      throw new Error(error.error || 'Failed to update role');
    }
    return await response.json();
  },

  // Assign permissions to role
  assignPermissions: async (roleId: number, permissionIds: number[]): Promise<{ message: string }> => {
    const response = await apiCall(`/Role/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify(permissionIds),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to assign permissions' }));
      throw new Error(error.error || 'Failed to assign permissions');
    }
    return await response.json();
  },

  // Delete (deactivate) role
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiCall(`/Role/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to deactivate role' }));
      throw new Error(error.error || 'Failed to deactivate role');
    }
    return await response.json();
  },
};

// Export API base URL for direct use if needed
export { API_BASE_URL };

