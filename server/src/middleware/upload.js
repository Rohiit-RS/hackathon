const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateMagicBytes, computeFileHash, MAX_FILE_SIZE } = require('../utils/fileValidator');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Memory storage so we can validate magic bytes before committing to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE // 5 MB
  }
});

/**
 * Middleware that validates image buffer magic bytes and writes to disk
 */
function handleValidatedUpload(req, res, next) {
  if (!req.file) {
    return next();
  }

  // 1. Check Magic Bytes
  const magicValidation = validateMagicBytes(req.file.buffer);
  if (!magicValidation.isValid) {
    return res.status(400).json({
      error: magicValidation.error
    });
  }

  // 2. Compute file hash
  const fileHash = computeFileHash(req.file.buffer);

  // 3. Generate sanitized file name
  const ext = magicValidation.mimeType === 'image/jpeg' ? '.jpg' : magicValidation.mimeType === 'image/png' ? '.png' : '.webp';
  const filename = `img_${Date.now()}_${fileHash.substring(0, 8)}${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  // 4. Save to disk with EXIF privacy preserved
  fs.writeFileSync(filepath, req.file.buffer);

  // Attach metadata to req.file
  req.file.savedFilename = filename;
  req.file.fileHash = fileHash;
  req.file.publicUrl = `/uploads/${filename}`;
  req.file.mimeType = magicValidation.mimeType;

  next();
}

module.exports = {
  upload,
  handleValidatedUpload,
  UPLOADS_DIR
};
