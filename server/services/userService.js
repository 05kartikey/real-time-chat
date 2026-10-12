import User from "../models/User.js"
import escapeRegex from "../utils/escapeRegex.js"
import * as uploadService from "./uploadService.js"

export const PUBLIC_FIELDS = "username avatar bio lastSeen"

export const search = (userId, query) =>
  User.find({
    _id: { $ne: userId },
    username: { $regex: `^${escapeRegex(query)}`, $options: "i" },
  })
    .select(PUBLIC_FIELDS)
    .sort({ username: 1 })
    .limit(10)

export const updateProfile = async (user, updates) => {
  Object.assign(user, updates)
  await user.save()
  return user
}

export const updateAvatar = async (user, file) => {
  const result = await uploadService.uploadAvatar(file.buffer)
  const previousPublicId = user.avatar.publicId

  user.avatar = { url: result.secure_url, publicId: result.public_id }
  await user.save()

  // Only remove the old image once the new one is safely saved
  await uploadService.destroy(previousPublicId)
  return user
}
