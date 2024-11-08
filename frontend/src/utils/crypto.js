// utils/crypto.js

/**
 * Converts an ArrayBuffer to a base64 string
 */
export const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Converts a base64 string to an ArrayBuffer
 */
export const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generates a new encryption key
 */
export const generateKey = async () => {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    throw new Error(`Failed to generate key: ${error.message}`);
  }
};

/**
 * Encrypts data using AES-GCM
 * @param {string} data - The data to encrypt
 * @returns {Promise<{encrypted: string, iv: string, key: string}>}
 */
export const encryptData = async (data, providedKey = null) => {
  try {
    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Use provided key or generate a new one
    let key;
    if (providedKey) {
      // Import the provided key
      const keyBuffer = base64ToArrayBuffer(providedKey);
      key = await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        {
          name: "AES-GCM",
          length: 256
        },
        false, // Set to false since we don't need to export it again
        ["encrypt"]
      );
    } else {
      // Generate a new key if none provided
      key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256
        },
        true,
        ["encrypt", "decrypt"]
      );
    }

    // Convert the data to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Perform the encryption
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      dataBuffer
    );

    // Only return the key if we generated a new one
    return {
      encrypted: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv),
      ...(providedKey ? {} : { key: await window.crypto.subtle.exportKey("raw", key).then(arrayBufferToBase64) })
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypts data using AES-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} keyData - Base64 encoded key
 * @param {string} ivData - Base64 encoded IV
 * @returns {Promise<string>}
 */
export const decryptData = async (encryptedData, keyData, ivData) => {
  try {
    // Convert base64 strings back to ArrayBuffers
    const encryptedBuffer = base64ToArrayBuffer(encryptedData);
    const keyBuffer = base64ToArrayBuffer(keyData);
    const iv = base64ToArrayBuffer(ivData);

    // Import the key
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["decrypt"]
    );

    // Perform the decryption
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv)
      },
      key,
      encryptedBuffer
    );

    // Convert the decrypted ArrayBuffer back to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Test function to verify encryption/decryption is working
 */
export const testCrypto = async () => {
  try {
    const testData = "Hello, World!";
    console.log("Original:", testData);

    // Encrypt
    const encrypted = await encryptData(testData);
    console.log("Encrypted:", encrypted);

    // Decrypt
    const decrypted = await decryptData(
      encrypted.encrypted,
      encrypted.key,
      encrypted.iv
    );
    console.log("Decrypted:", decrypted);

    return testData === decrypted;
  } catch (error) {
    console.error("Crypto test failed:", error);
    return false;
  }
};

// ... keep all your existing functions ...

/**
 * Derives a master key from a password using PBKDF2
 * @param {string} password - The user's password
 * @returns {Promise<{encrypted: string, iv: string, key: string}>}
 */
export const deriveMasterKeyFromPassword = async (password) => {
  try {
    // Convert password to buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    // Use fixed bytes for consistency
    const fixedSalt = encoder.encode('ncrypt-master-key-salt');

    // Derive bits
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: fixedSalt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 256-bit key
    );

    // Use the derived bits to encrypt a known value
    // This gives us the same format as our regular encryptData function
    const derivedKey = await window.crypto.subtle.importKey(
      'raw',
      derivedBits,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );

    // Generate IV and encrypt a fixed string to get a consistent format
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      derivedKey,
      encoder.encode('master-key-verification')
    );

    // Export in the same format as our regular encryptData
    const exportedKey = await window.crypto.subtle.exportKey('raw', derivedKey);

    return {
      encrypted: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv),
      key: arrayBufferToBase64(exportedKey)
    };
  } catch (error) {
    throw new Error(`Failed to derive master key: ${error.message}`);
  }
};