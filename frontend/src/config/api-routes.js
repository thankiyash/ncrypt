export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const API_ROUTES = {
  // Auth routes
  REGISTER_FIRST_USER: `${API_BASE}/users/register-first-user`,
  LOGIN: `${API_BASE}/auth/login`,
  LOGOUT: `${API_BASE}/auth/logout`,
  
  // Secrets routes
  SECRETS: `${API_BASE}/secrets`,
  SECRET: (id) => `${API_BASE}/secrets/${id}`,
  
  
  // Add this new route
  CHECK_OWNER: `${API_BASE}/users/check-owner`,
  TEAM_MEMBERS: `${API_BASE}/users/team-members`,
  INVITE_MEMBER: `${API_BASE}/users/invite`,
  ACCEPT_INVITE: `${API_BASE}/users/accept-invite`,
  TEAM_MEMBER: (id) => `${API_BASE}/users/team-members/${id}`,
  PENDING_INVITES: `${API_BASE}/users/pending-invites`,

};