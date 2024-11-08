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

      // Encrypt the secret data
      const encryptedData = await encryptData(
        JSON.stringify({
          password,
          description
        }),
        masterKeyData.key
      );

      // Only send the encrypted data and IV to the server, keep the key local
      const serverEncryptedData = {
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv
        // Deliberately omit the key
      };

      const data = await apiRequest(API_ROUTES.SECRETS, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: 'Encrypted', // Optional: Send a placeholder
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

          // Use the stored master key for decryption
          const decryptedData = await decryptData(
            encryptedData.encrypted,
            masterKeyData.key, // Master key stored in session
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
    isLoading,
    error
  };
}