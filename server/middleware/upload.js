import multer from "multer"
import ApiError from "../utils/ApiError.js"

const MB = 1024 * 1024

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

// Memory storage: files are streamed on to Cloudinary, never written to disk.
// The MIME type comes from the client, so it's a first filter only. Cloudinary
// re-encodes images, and files are served from its domain, not ours.
const createUpload = ({ field, maxSize, allowedTypes }) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) return cb(null, true)
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype || "unknown"}`))
    },
  }).single(field)

const requireFile = (req, _res, next) => {
  if (!req.file) return next(ApiError.badRequest("No file uploaded"))
  next()
}

export const avatarUpload = [
  createUpload({ field: "avatar", maxSize: 2 * MB, allowedTypes: IMAGE_TYPES }),
  requireFile,
]

export const attachmentUpload = [
  createUpload({ field: "file", maxSize: 10 * MB, allowedTypes: [...IMAGE_TYPES, ...DOCUMENT_TYPES] }),
  requireFile,
]
