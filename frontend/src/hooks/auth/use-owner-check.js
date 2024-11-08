// src/hooks/auth/use-owner-check.js
import { useState } from 'react';
import { API_ROUTES } from '@/config/api-routes';
import { apiRequest } from '@/utils/api-client';

export function useOwnerCheck() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkOwnerExists = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest(API_ROUTES.CHECK_OWNER, {
        skipAuth: true // This is a public endpoint
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkOwnerExists,
    isLoading,
    error
  };
}