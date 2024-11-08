import { arrayBufferToBase64, base64ToArrayBuffer } from './crypto';


/**
 * Encrypts user's master key with their derived key
 * @param {Object} masterKeyData - The master key data to protect
 * @param {string} derivedKey - The key derived from user's password
 * @returns {Promise<{encrypted: string, iv: string, key: string}>}
 */
export const protectMasterKey = async (masterKeyData, derivedKey) => {
    try {
      // Convert derivedKey from base64 to importable format
      const keyBuffer = base64ToArrayBuffer(derivedKey);
      
      // Import the derived key for use with AES-GCM
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt']
      );
  
      // Generate IV for this encryption
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Convert master key data to buffer
      const encoder = new TextEncoder();
      const masterKeyBuffer = encoder.encode(JSON.stringify(masterKeyData));
      
      // Encrypt the master key data with the derived key
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        cryptoKey,
        masterKeyBuffer
      );
  
      // Return the encrypted data in transportable format
      return {
        encrypted: arrayBufferToBase64(encryptedBuffer),
        iv: arrayBufferToBase64(iv),
        key: derivedKey // Store the derived key for later use
      };
    } catch (error) {
      throw new Error(`Master key protection failed: ${error.message}`);
    }
  };
  
  /**
   * Recovers the master key using the derived key
   * @param {Object} encryptedMasterKey - The encrypted master key data
   * @param {string} derivedKey - The key derived from user's password
   * @returns {Promise<Object>} - The decrypted master key data
   */
  export const recoverMasterKey = async (encryptedMasterKey, derivedKey) => {
    try {
      // Convert derivedKey from base64 to importable format
      const keyBuffer = base64ToArrayBuffer(derivedKey);
      
      // Import the derived key for use with AES-GCM
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['decrypt']
      );
  
      // Convert encrypted data back to buffer
      const encryptedBuffer = base64ToArrayBuffer(encryptedMasterKey.encrypted);
      const iv = base64ToArrayBuffer(encryptedMasterKey.iv);
  
      // Decrypt the master key data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv)
        },
        cryptoKey,
        encryptedBuffer
      );
  
      // Convert decrypted buffer back to object
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      throw new Error(`Master key recovery failed: ${error.message}`);
    }
  };
  