// Mirrors the server's zod rules so users get instant feedback. The server
// still validates everything: client-side checks are for UX, not security.

export const validateUsername = (value) => {
  const v = value.trim()
  if (v.length < 3) return "Username must be at least 3 characters"
  if (v.length > 20) return "Username must be at most 20 characters"
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Only letters, numbers and underscores"
  return null
}

export const validateEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : "Enter a valid email address"

export const validatePassword = (value) => {
  if (value.length < 8) return "Password must be at least 8 characters"
  if (value.length > 72) return "Password must be at most 72 characters"
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return "Use at least one letter and one number"
  return null
}

// Upload limits (kept in sync with server/middleware/upload.js)
const MB = 1024 * 1024
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
export const ATTACHMENT_TYPES = [
  ...IMAGE_TYPES,
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]
export const MAX_ATTACHMENT_SIZE = 10 * MB
export const MAX_AVATAR_SIZE = 2 * MB

export const validateFile = (file, { types, maxSize }) => {
  if (!types.includes(file.type)) return "That file type isn't supported"
  if (file.size > maxSize) return `File must be smaller than ${maxSize / MB} MB`
  return null
}
