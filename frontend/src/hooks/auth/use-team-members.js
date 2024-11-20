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

  const getPendingInvites = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest(API_ROUTES.PENDING_INVITES);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const inviteTeamMember = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest(API_ROUTES.INVITE_MEMBER, {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role_level: data.role_level
        })
      });
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
        body: JSON.stringify(data)
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
        method: 'DELETE'
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
    getPendingInvites,
    inviteTeamMember,
    updateTeamMember,
    deleteTeamMember,
    isLoading,
    error
  };
}