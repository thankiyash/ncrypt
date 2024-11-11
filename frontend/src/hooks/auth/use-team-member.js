import { useState } from 'react';
import { apiRequest } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';

export function useTeamMembers() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTeamMembers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest(API_ROUTES.TEAM_MEMBERS);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamMember = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest(API_ROUTES.TEAM_MEMBER(id));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamMember = async (id, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest(API_ROUTES.TEAM_MEMBER(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTeamMember = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiRequest(API_ROUTES.TEAM_MEMBER(id), {
        method: 'DELETE',
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getTeamMembers,
    getTeamMember,
    updateTeamMember,
    deleteTeamMember,
    isLoading,
    error
  };
}