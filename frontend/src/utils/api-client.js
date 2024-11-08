// src/utils/api-client.js
import { getAuthToken } from './auth';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error('Error parsing response:', e);
    throw new ApiError('Invalid response from server', response.status);
  }
  
  if (!response.ok) {
    // If token is invalid/expired
    if (response.status === 401) {
      // Clear stored tokens
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
      // You might want to redirect to login here
      window.location.href = '/login';
    }
    throw new ApiError(data.detail || 'API Error', response.status);
  }
  
  return data;
}

export async function apiRequest(endpoint, options = {}) {
  const { skipAuth = false, ...config } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth headers unless skipAuth is true
  if (!skipAuth) {
    const authData = getAuthToken();
    if (!authData?.token) {
      throw new ApiError('No authentication token found', 401);
    }
    headers.Authorization = `${authData.tokenType || 'Bearer'} ${authData.token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...config,
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error', 0);
  }
}