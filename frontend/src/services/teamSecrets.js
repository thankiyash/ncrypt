// services/teamSecrets.js
import { teamCrypto } from '../utils/teamCrypto';
import { authService } from './auth';

// In-memory storage for demo purposes
const teams = new Map();
const teamMembers = new Map();
const teamSecrets = new Map();

export class TeamSecretsService {
    /**
     * Creates a new team and generates its encryption key
     */
    async createTeam(teamName, creatorMasterKey) {
        try {
            // Generate team key
            const teamKey = await teamCrypto.generateTeamKey();

            // Encrypt team key for creator
            const creatorTeamKey = await teamCrypto.encryptTeamKeyForMember(
                teamKey,
                creatorMasterKey
            );

            const teamId = Date.now().toString();

            // Store team data
            teams.set(teamId, {
                id: teamId,
                name: teamName,
                createdAt: new Date().toISOString()
            });

            // Store creator's encrypted team key
            teamMembers.set(`${teamId}-${authService.getCurrentUser()}`, {
                userId: authService.getCurrentUser(),
                teamId,
                encryptedTeamKey: creatorTeamKey
            });

            return { teamId, teamKey };
        } catch (error) {
            throw new Error(`Failed to create team: ${error.message}`);
        }
    }

    /**
     * Adds a new member to the team
     */
    async addTeamMember(teamId, newMemberUserId, newMemberMasterKey) {
        try {
            // Get current user's team key
            const currentUserTeamKey = await this.getTeamKey(teamId);

            // Encrypt team key for new member
            const memberTeamKey = await teamCrypto.encryptTeamKeyForMember(
                currentUserTeamKey,
                newMemberMasterKey
            );

            // Store new member's encrypted team key
            teamMembers.set(`${teamId}-${newMemberUserId}`, {
                userId: newMemberUserId,
                teamId,
                encryptedTeamKey: memberTeamKey
            });
        } catch (error) {
            throw new Error(`Failed to add team member: ${error.message}`);
        }
    }

    /**
     * Gets the team key for current user
     */
    async getTeamKey(teamId) {
        const currentUser = authService.getCurrentUser();
        const memberData = teamMembers.get(`${teamId}-${currentUser}`);

        if (!memberData) {
            throw new Error('User is not a member of this team');
        }

        const currentUserMasterKey = JSON.parse(sessionStorage.getItem('masterKey'));
        return await teamCrypto.decryptTeamKey(
            memberData.encryptedTeamKey,
            currentUserMasterKey
        );
    }

    /**
     * Creates a new team secret
     */
    async createTeamSecret(teamId, secretName, secretValue) {
        try {
            // Get team key
            const teamKey = await this.getTeamKey(teamId);

            // Encrypt secret with team key
            const encryptedSecret = await teamCrypto.encryptTeamSecret(
                secretValue,
                teamKey
            );

            const secretId = Date.now().toString();

            // Store encrypted secret
            teamSecrets.set(secretId, {
                id: secretId,
                teamId,
                name: secretName,
                data: encryptedSecret,
                createdAt: new Date().toISOString()
            });

            return secretId;
        } catch (error) {
            throw new Error(`Failed to create team secret: ${error.message}`);
        }
    }

    /**
     * Gets a decrypted team secret
     */
    async getTeamSecret(teamId, secretId) {
        try {
            const secret = teamSecrets.get(secretId);
            if (!secret || secret.teamId !== teamId) {
                throw new Error('Secret not found');
            }

            const teamKey = await this.getTeamKey(teamId);
            const decryptedValue = await teamCrypto.decryptTeamSecret(
                secret.data,
                teamKey
            );

            return {
                ...secret,
                value: decryptedValue
            };
        } catch (error) {
            throw new Error(`Failed to get team secret: ${error.message}`);
        }
    }

    /**
     * Lists all team secrets (without decrypted values)
     */
    /**
     * Lists all team secrets (without decrypted values)
     * @param {string} teamId - The team ID to get secrets for
     * @returns {Array} Array of team secrets without encrypted data
     */
    getTeamSecrets(teamId) {
        return Array.from(teamSecrets.values())
            .filter(secret => secret.teamId === teamId)
            .map(secret => ({
                id: secret.id,
                teamId: secret.teamId,
                name: secret.name,
                createdAt: secret.createdAt
                // Add any other properties you want to include except 'data'
            }));
    }

    /**
     * Lists all teams the current user is a member of
     */
    getUserTeams() {
        const currentUser = authService.getCurrentUser();
        return Array.from(teamMembers.values())
            .filter(member => member.userId === currentUser)
            .map(member => teams.get(member.teamId));
    }
}

export const teamSecretsService = new TeamSecretsService();