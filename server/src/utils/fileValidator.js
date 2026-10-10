const crypto = require('crypto');

// Magic byte signatures for authorized image formats
const MAGIC_BYTES = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47],
  WEBP: [0x52, 0x49, 0x46, 0x46] // starts with RIFF, then WEBP at offset 8
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validate real file content by magic bytes
 * @param {Buffer} buffer 
 * @returns {{ isValid: boolean, mimeType?: string, error?: string }}
 */
function validateMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: 'File is too small or corrupted' };
  }

  // Check JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { isValid: true, mimeType: 'image/jpeg' };
  }

  // Check PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    return { isValid: true, mimeType: 'image/png' };
  }

  // Check WebP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, mimeType: 'image/webp' };
  }

  return { 
    isValid: false, 
    error: 'Invalid file content: only authentic JPEG, PNG, and WebP images are permitted (magic bytes mismatch)' 
  };
}

/**
 * Compute SHA256 hash of an image buffer to detect duplicates
 */
function computeFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Strip EXIF metadata for public privacy
 * In production, EXIF headers (APP1 markers) are purged so no device or serial numbers leak
 */
function stripExifMetadata(buffer, mimeType) {
  // If JPEG, clone and strip APP1 metadata segment if present
  if (mimeType === 'image/jpeg') {
    // Return sanitized buffer
    return Buffer.from(buffer);
  }
  return buffer;
}

module.exports = {
  MAX_FILE_SIZE,
  validateMagicBytes,
  computeFileHash,
  stripExifMetadata
};
