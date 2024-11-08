// src/utils/auth.js
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'token',
  TOKEN_TYPE: 'token_type',
  USER_DATA: 'user_data',
  MASTER_KEY: 'masterKey'
};

export function storeAuthData(data) {
  if (!data) {
    console.error('No data provided to storeAuthData');
    return;
  }

  console.log('Storing auth data:', { 
    hasToken: !!data.access_token,
    tokenType: data.token_type,
    hasEmail: !!data.email
  });

  // Store auth token
  if (data.access_token) {
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, data.access_token);
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_TYPE, data.token_type || 'Bearer');
  } else {
    console.error('No access token in auth data');
  }

  // Store user data
  const userData = {
    email: data.email || data.sub,
    roleLevel: data.role_level
  };
  
  localStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
}

export function clearAuthData() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN_TYPE);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER_DATA);
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.MASTER_KEY);
}

export function getAuthToken() {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  const tokenType = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_TYPE) || 'Bearer';
  
  // Add logging
  console.log('Getting auth token:', { hasToken: !!token, tokenType });
  
  return token ? { token, tokenType } : null;
}

export function getUserData() {
  const data = localStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA);
  return data ? JSON.parse(data) : null;
}

export function isAuthenticated() {
  const token = getAuthToken();
  const userData = getUserData();
  return !!(token && userData);
}