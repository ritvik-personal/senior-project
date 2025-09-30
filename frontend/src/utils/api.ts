// API configuration utility
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  // Get full API URL
  getUrl: (endpoint: string) => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
  },

  // Get JWT token from localStorage
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  // Make authenticated API request
  request: async (endpoint: string, options: RequestInit = {}) => {
    const token = api.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(api.getUrl(endpoint), {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  },

  // Convenience methods
  get: (endpoint: string, options: RequestInit = {}) => 
    api.request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, data?: any, options: RequestInit = {}) =>
    api.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (endpoint: string, data?: any, options: RequestInit = {}) =>
    api.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (endpoint: string, options: RequestInit = {}) =>
    api.request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
