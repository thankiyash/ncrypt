// src/hooks/auth/use-secrets.js
import { useState } from 'react';
import { API_ROUTES } from '@/config/api-routes';
import { encryptData, decryptData } from '@/utils/crypto';
import { apiRequest } from '@/utils/api-client';

export function useSecrets() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSecret = async ({ title, password, description = '' }) => {
    setIsLoading(true);
    setError(null);

    try {
      const masterKeyData = JSON.parse(sessionStorage.getItem('masterKey'));
      if (!masterKeyData) {
        throw new Error('No master key found. Please login again.');
      }

      // Client-side encryption of the secret data
      const encryptedData = await encryptData(
        JSON.stringify({
          password,
          description
        }),
        masterKeyData.key
      );

      // Only send encrypted data to server
      const serverEncryptedData = {
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv
      };

      const data = await apiRequest(API_ROUTES.SECRETS, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: 'Encrypted',
          client_encrypted_data: JSON.stringify(serverEncryptedData),
          is_password: true
        }),
      });

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSecrets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const masterKeyData = JSON.parse(sessionStorage.getItem('masterKey'));
      if (!masterKeyData) {
        throw new Error('No master key found. Please login again.');
      }

      const secrets = await apiRequest(API_ROUTES.SECRETS);

      const decryptedSecrets = await Promise.all(secrets.map(async (secret) => {
        try {
          const encryptedData = JSON.parse(secret.client_encrypted_data);

          // Decrypt using stored master key
          const decryptedData = await decryptData(
            encryptedData.encrypted,
            masterKeyData.key,
            encryptedData.iv
          );
          const parsedData = JSON.parse(decryptedData);

          return {
            ...secret,
            password: parsedData.password,
            description: parsedData.description
          };
        } catch (err) {
          console.error(`Failed to decrypt secret ${secret.id}:`, err);
          return {
            ...secret,
            password: '**DECRYPTION_FAILED**',
            description: 'Failed to decrypt description'
          };
        }
      }));

      return decryptedSecrets;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const shareSecret = async (secretId, shareData) => {
    setIsLoading(true);
    setError(null);

    try {
      const masterKeyData = JSON.parse(sessionStorage.getItem('masterKey'));
      if (!masterKeyData) {
        throw new Error('No master key found. Please login again.');
      }

      // Make the share request
      const response = await apiRequest(`${API_ROUTES.SECRETS}/${secretId}/share`, {
        method: 'POST',
        body: JSON.stringify(shareData)
      });

      // Decrypt the response data
      try {
        const encryptedData = JSON.parse(response.client_encrypted_data);
        const decryptedData = await decryptData(
          encryptedData.encrypted,
          masterKeyData.key,
          encryptedData.iv
        );
        const parsedData = JSON.parse(decryptedData);

        return {
          ...response,
          password: parsedData.password,
          description: parsedData.description
        };
      } catch (err) {
        console.error('Failed to decrypt shared secret:', err);
        return {
          ...response,
          password: '**DECRYPTION_FAILED**',
          description: 'Failed to decrypt description'
        };
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSharedSecrets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const masterKeyData = JSON.parse(sessionStorage.getItem('masterKey'));
      if (!masterKeyData) {
        throw new Error('No master key found. Please login again.');
      }

      const secrets = await apiRequest(API_ROUTES.SHARED_SECRETS);

      // Decrypt the shared secrets
      const decryptedSecrets = await Promise.all(secrets.map(async (secret) => {
        try {
          const encryptedData = JSON.parse(secret.client_encrypted_data);
          const decryptedData = await decryptData(
            encryptedData.encrypted,
            masterKeyData.key,
            encryptedData.iv
          );
          const parsedData = JSON.parse(decryptedData);

          return {
            ...secret,
            password: parsedData.password,
            description: parsedData.description
          };
        } catch (err) {
          console.error(`Failed to decrypt shared secret ${secret.id}:`, err);
          return {
            ...secret,
            password: '**DECRYPTION_FAILED**',
            description: 'Failed to decrypt description'
          };
        }
      }));

      return decryptedSecrets;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSecret = async (secretId) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiRequest(`${API_ROUTES.SECRETS}/${secretId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };


  return {
    createSecret,
    getSecrets,
    deleteSecret,
    shareSecret,
    getSharedSecrets,
    isLoading,
    error
  };
}