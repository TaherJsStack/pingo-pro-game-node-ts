import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File type validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf|webp/;
  const isValidType = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const isValidMimeType = allowedFileTypes.test(file.mimetype);
  if (isValidType && isValidMimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed!'));
  }
};

// Initialize multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter,
});

export default upload;
