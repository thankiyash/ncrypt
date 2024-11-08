// src/hooks/auth/use-login.js
import { useState } from 'react';
import { API_ROUTES } from '@/config/api-routes';
import { apiRequest } from '@/utils/api-client';
import { storeAuthData } from '@/utils/auth';
import { deriveMasterKeyFromPassword } from '@/utils/crypto';
import { useAuth } from './use-auth-context';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const hashPassword = async (password) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const loginUser = async ({ email, password }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Derive master key from password
      const masterKeyResult = await deriveMasterKeyFromPassword(password);

      // Hash password for authentication
      const hashedPassword = await hashPassword(password);

      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', hashedPassword); // Send hashed password

      const response = await apiRequest(API_ROUTES.LOGIN, {
        method: 'POST',
        skipAuth: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // Store master key
      sessionStorage.setItem('masterKey', JSON.stringify(masterKeyResult));

      // Store auth data
      const userData = {
        ...response,
        email,
      };
      storeAuthData(userData);

      // Update auth context
      login(userData);

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login: loginUser,
    isLoading,
    error
  };
}