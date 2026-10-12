import * as userService from "../services/userService.js"

export const search = async (req, res) => {
  const users = await userService.search(req.user._id, req.query.q)
  res.json({ users })
}

export const updateMe = async (req, res) => {
  const user = await userService.updateProfile(req.user, req.body)
  res.json({ user })
}

export const updateAvatar = async (req, res) => {
  const user = await userService.updateAvatar(req.user, req.file)
  res.json({ user })
}
