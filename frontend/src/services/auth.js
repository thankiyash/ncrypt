// services/auth.js
import { encryptData, decryptData } from '@/utils/crypto';

// Simulated user storage (this would normally be in a database)
const dummyUsers = new Map();

export class AuthService {
  /**
   * Register a new user with dummy data
   */
  async register(email, password) {
    try {
      // Generate a master key for the user's secrets
      const masterKeyResult = await encryptData('master-secret-key');
      
      // Store user data in memory
      dummyUsers.set(email, {
        email,
        password, // In real app, this would be hashed
        masterKey: masterKeyResult
      });

      // Store master key in session
      sessionStorage.setItem('masterKey', JSON.stringify(masterKeyResult));
      
      return { success: true, email };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Login user with dummy data
   */
  async login(email, password) {
    try {
      const user = dummyUsers.get(email);
      if (!user || user.password !== password) {
        throw new Error('Invalid credentials');
      }

      // Store master key in session
      sessionStorage.setItem('masterKey', JSON.stringify(user.masterKey));
      
      return { success: true, email };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Encrypt a secret
   */
  async encryptSecret(secretText) {
    try {
      const masterKeyData = JSON.parse(sessionStorage.getItem('masterKey'));
      if (!masterKeyData) {
        throw new Error('No master key found. Please login first.');
      }
      
      return await encryptData(secretText);
    } catch (error) {
      throw new Error(`Failed to encrypt secret: ${error.message}`);
    }
  }

  /**
   * Decrypt a secret
   */
  async decryptSecret(encryptedData) {
    try {
      const masterKeyData = JSON.parse(sessionStorage.getItem('masterKey'));
      if (!masterKeyData) {
        throw new Error('No master key found. Please login first.');
      }
      
      return await decryptData(
        encryptedData.encrypted,
        encryptedData.key,
        encryptedData.iv
      );
    } catch (error) {
      throw new Error(`Failed to decrypt secret: ${error.message}`);
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!sessionStorage.getItem('masterKey');
  }

  /**
   * Logout user
   */
  logout() {
    sessionStorage.removeItem('masterKey');
  }
}

export const authService = new AuthService();