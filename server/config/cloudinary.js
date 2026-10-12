import { v2 as cloudinary } from "cloudinary"
import env from "./env.js"

// Uploads are disabled (dev only) when Cloudinary isn't configured
export const cloudinaryEnabled = env.hasCloudinary

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export default cloudinary
