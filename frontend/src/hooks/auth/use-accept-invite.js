import { useState } from 'react';
import { API_ROUTES } from '@/config/api-routes';
import { apiRequest } from '@/utils/api-client';
import { storeAuthData } from '@/utils/auth';
import { deriveMasterKeyFromPassword } from '@/utils/crypto';

export function useAcceptInvite() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const hashPassword = async (password) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const acceptInvite = async ({ token, password }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Derive master key from password
      const masterKeyResult = await deriveMasterKeyFromPassword(password);
      
      // Hash password for authentication
      const hashedPassword = await hashPassword(password);

      // Accept the invitation
      const acceptResponse = await apiRequest(API_ROUTES.ACCEPT_INVITE, {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          token,
          password: hashedPassword
        })
      });

      // Now perform login to get the auth token
      const formData = new URLSearchParams();
      formData.append('username', acceptResponse.email);
      formData.append('password', hashedPassword);

      const loginResponse = await apiRequest(API_ROUTES.LOGIN, {
        method: 'POST',
        skipAuth: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // Store master key
      sessionStorage.setItem('masterKey', JSON.stringify(masterKeyResult));

      // Store auth data from login response
      const authData = {
        ...loginResponse,
        email: acceptResponse.email,
        role_level: acceptResponse.role_level,
      };
      
      storeAuthData(authData);

      return authData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    acceptInvite,
    isLoading,
    error
  };
}