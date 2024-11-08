// utils/teamCrypto.js
import { encryptData, decryptData, arrayBufferToBase64 } from './crypto';

export class TeamCrypto {
  /**
   * Creates a team key that will be used to encrypt shared secrets
   */
  async generateTeamKey() {
    try {
      // Generate a random team key
      const teamKeyBytes = window.crypto.getRandomValues(new Uint8Array(32));
      return await encryptData(arrayBufferToBase64(teamKeyBytes));
    } catch (error) {
      throw new Error(`Team key generation failed: ${error.message}`);
    }
  }

  /**
   * Encrypts the team key for a specific team member using their public key
   * For this example, we'll use their master key instead of public key cryptography
   * @param {Object} teamKey - The team's encryption key
   * @param {Object} memberMasterKey - Team member's master key
   */
  async encryptTeamKeyForMember(teamKey, memberMasterKey) {
    try {
      return await encryptData(JSON.stringify(teamKey), memberMasterKey.key);
    } catch (error) {
      throw new Error(`Failed to encrypt team key for member: ${error.message}`);
    }
  }

  /**
   * Decrypts the team key using member's master key
   */
  async decryptTeamKey(encryptedTeamKey, memberMasterKey) {
    try {
      const decryptedString = await decryptData(
        encryptedTeamKey.encrypted,
        memberMasterKey.key,
        encryptedTeamKey.iv
      );
      return JSON.parse(decryptedString);
    } catch (error) {
      throw new Error(`Failed to decrypt team key: ${error.message}`);
    }
  }

  /**
   * Encrypts a secret for team access
   */
  async encryptTeamSecret(secret, teamKey) {
    try {
      return await encryptData(secret, teamKey.key);
    } catch (error) {
      throw new Error(`Failed to encrypt team secret: ${error.message}`);
    }
  }

  /**
   * Decrypts a team secret
   */
  async decryptTeamSecret(encryptedSecret, teamKey) {
    try {
      return await decryptData(
        encryptedSecret.encrypted,
        teamKey.key,
        encryptedSecret.iv
      );
    } catch (error) {
      throw new Error(`Failed to decrypt team secret: ${error.message}`);
    }
  }
}

export const teamCrypto = new TeamCrypto();