import cloudinary from "../config/cloudinary.js"
import logger from "../utils/logger.js"

// Files are held in memory by multer and streamed straight to Cloudinary,
// so nothing touches the server's disk.
export const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
    stream.end(buffer)
  })

export const uploadAvatar = (buffer) =>
  uploadBuffer(buffer, {
    folder: "chat/avatars",
    resource_type: "image",
    transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
  })

export const uploadAttachment = (file, conversationId) => {
  const isImage = file.mimetype.startsWith("image/")

  return uploadBuffer(file.buffer, {
    folder: `chat/conversations/${conversationId}`,
    // Non-images are stored as "raw" so they are served byte-for-byte
    resource_type: isImage ? "image" : "raw",
    use_filename: true,
    unique_filename: true,
    filename_override: file.originalname,
  })
}

// Best-effort: a failed cleanup shouldn't fail the user's request.
export const destroy = async (publicId, resourceType = "image") => {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    logger.warn({ err, publicId }, "Failed to delete Cloudinary asset")
  }
}
