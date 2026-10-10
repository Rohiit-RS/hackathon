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
    fileSize: MAX_FILE_SIZE, // 5 MB
    files: 3
  }
});

/**
 * Middleware that validates image buffer magic bytes and writes to disk
 */
function handleValidatedUpload(req, res, next) {
  const filesToProcess = [];
  if (req.file) {
    filesToProcess.push(req.file);
  } else if (req.files) {
    if (Array.isArray(req.files)) {
      filesToProcess.push(...req.files);
    } else {
      Object.values(req.files).forEach(fList => {
        if (Array.isArray(fList)) filesToProcess.push(...fList);
        else if (fList) filesToProcess.push(fList);
      });
    }
  }

  if (filesToProcess.length === 0) {
    return next();
  }

  // Count limit check: Maximum 3 photos per report, 1 per verification
  if (filesToProcess.length > 3) {
    return res.status(400).json({ error: 'Exceeded upload limit: Maximum 3 photos permitted per submission.' });
  }

  req.savedFiles = [];

  for (const file of filesToProcess) {
    // 1. Check Magic Bytes
    const magicValidation = validateMagicBytes(file.buffer);
    if (!magicValidation.isValid) {
      return res.status(400).json({
        error: magicValidation.error
      });
    }

    // 2. Compute file hash
    const fileHash = computeFileHash(file.buffer);

    // 3. Generate sanitized file name
    const ext = magicValidation.mimeType === 'image/jpeg' ? '.jpg' : magicValidation.mimeType === 'image/png' ? '.png' : '.webp';
    const filename = `img_${Date.now()}_${fileHash.substring(0, 8)}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // 4. Save to disk with EXIF privacy preserved
    fs.writeFileSync(filepath, file.buffer);

    // Attach metadata
    file.savedFilename = filename;
    file.fileHash = fileHash;
    file.publicUrl = `/uploads/${filename}`;
    file.mimeType = magicValidation.mimeType;

    req.savedFiles.push(file);
  }

  if (!req.file && req.savedFiles.length > 0) {
    req.file = req.savedFiles[0];
  }

  next();
}

module.exports = {
  upload,
  handleValidatedUpload,
  UPLOADS_DIR
};
