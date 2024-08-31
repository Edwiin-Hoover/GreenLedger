const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_ROUNDS = 12;

/**
 * Generate a random encryption key
 * @returns {string} Base64 encoded key
 */
const generateKey = () => {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
};

/**
 * Generate a random initialization vector
 * @returns {Buffer} Random IV
 */
const generateIV = () => {
  return crypto.randomBytes(IV_LENGTH);
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @param {string} key - Base64 encoded encryption key
 * @returns {object} Encrypted data with IV and tag
 */
const encrypt = (text, key) => {
  try {
    const keyBuffer = Buffer.from(key, 'base64');
    const iv = generateIV();
    
    const cipher = crypto.createCipher(ALGORITHM, keyBuffer, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt data using AES-256-GCM
 * @param {object} encryptedData - Object containing encrypted, iv, and tag
 * @param {string} key - Base64 encoded encryption key
 * @returns {string} Decrypted text
 */
const decrypt = (encryptedData, key) => {
  try {
    const { encrypted, iv, tag } = encryptedData;
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    
    const decipher = crypto.createDecipher(ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
};

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Hex encoded token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random API key
 * @returns {string} Base64 encoded API key
 */
const generateApiKey = () => {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(32);
  const combined = Buffer.concat([
    Buffer.from(timestamp),
    randomBytes
  ]);
  
  return combined.toString('base64');
};

/**
 * Create HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @param {string} algorithm - HMAC algorithm (default: sha256)
 * @returns {string} Hex encoded signature
 */
const createHMAC = (data, secret, algorithm = 'sha256') => {
  return crypto.createHmac(algorithm, secret)
    .update(data)
    .digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @param {string} algorithm - HMAC algorithm (default: sha256)
 * @returns {boolean} True if signature is valid
 */
const verifyHMAC = (data, signature, secret, algorithm = 'sha256') => {
  const expectedSignature = createHMAC(data, secret, algorithm);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * Generate a hash of data
 * @param {string} data - Data to hash
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {string} Hex encoded hash
 */
const hash = (data, algorithm = 'sha256') => {
  return crypto.createHash(algorithm)
    .update(data)
    .digest('hex');
};

/**
 * Generate a secure session ID
 * @returns {string} Session ID
 */
const generateSessionId = () => {
  const timestamp = Date.now();
  const randomData = crypto.randomBytes(24);
  const combined = `${timestamp}-${randomData.toString('hex')}`;
  return hash(combined);
};

/**
 * Encrypt sensitive user data
 * @param {object} userData - User data to encrypt
 * @param {string} masterKey - Master encryption key
 * @returns {object} Encrypted user data
 */
const encryptUserData = (userData, masterKey) => {
  const sensitiveFields = ['email', 'phone', 'address', 'taxId', 'bankAccount'];
  const encryptedData = { ...userData };
  
  sensitiveFields.forEach(field => {
    if (userData[field]) {
      encryptedData[field] = encrypt(userData[field], masterKey);
    }
  });
  
  return encryptedData;
};

/**
 * Decrypt sensitive user data
 * @param {object} encryptedData - Encrypted user data
 * @param {string} masterKey - Master encryption key
 * @returns {object} Decrypted user data
 */
const decryptUserData = (encryptedData, masterKey) => {
  const sensitiveFields = ['email', 'phone', 'address', 'taxId', 'bankAccount'];
  const decryptedData = { ...encryptedData };
  
  sensitiveFields.forEach(field => {
    if (encryptedData[field] && typeof encryptedData[field] === 'object') {
      try {
        decryptedData[field] = decrypt(encryptedData[field], masterKey);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error.message);
        decryptedData[field] = null;
      }
    }
  });
  
  return decryptedData;
};

/**
 * Generate a secure file encryption key
 * @returns {object} Key and IV for file encryption
 */
const generateFileKey = () => {
  return {
    key: generateKey(),
    iv: generateIV().toString('hex')
  };
};

/**
 * Encrypt file data
 * @param {Buffer} fileData - File data to encrypt
 * @param {string} key - Encryption key
 * @param {string} iv - Initialization vector
 * @returns {object} Encrypted file data and metadata
 */
const encryptFile = (fileData, key, iv) => {
  try {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    const cipher = crypto.createCipher(ALGORITHM, keyBuffer, ivBuffer);
    
    const encrypted = Buffer.concat([
      cipher.update(fileData),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      tag: tag.toString('hex'),
      size: encrypted.length
    };
  } catch (error) {
    throw new Error(`File encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt file data
 * @param {Buffer} encryptedData - Encrypted file data
 * @param {string} key - Encryption key
 * @param {string} iv - Initialization vector
 * @param {string} tag - Authentication tag
 * @returns {Buffer} Decrypted file data
 */
const decryptFile = (encryptedData, key, iv, tag) => {
  try {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    
    const decipher = crypto.createDecipher(ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    throw new Error(`File decryption failed: ${error.message}`);
  }
};

module.exports = {
  // Key and token generation
  generateKey,
  generateToken,
  generateApiKey,
  generateSessionId,
  generateFileKey,
  
  // Basic encryption/decryption
  encrypt,
  decrypt,
  
  // Password hashing
  hashPassword,
  verifyPassword,
  
  // HMAC operations
  createHMAC,
  verifyHMAC,
  
  // Hashing
  hash,
  
  // User data encryption
  encryptUserData,
  decryptUserData,
  
  // File encryption
  encryptFile,
  decryptFile,
  
  // Constants
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  TAG_LENGTH,
  SALT_ROUNDS,
};
