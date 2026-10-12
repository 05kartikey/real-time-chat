import jwt from "jsonwebtoken"
import User from "../models/User.js"
import ApiError from "../utils/ApiError.js"
import env from "../config/env.js"

export const signToken = (userId) =>
  jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })

// Shared by the HTTP `protect` middleware and the Socket.IO handshake, so both
// transports apply exactly the same rules.
export const authenticateToken = async (token) => {
  if (!token) throw ApiError.unauthorized("No token provided")

  const payload = jwt.verify(token, env.JWT_SECRET)
  const user = await User.findById(payload.sub)

  // A valid signature isn't enough: the account may have been deleted since
  if (!user) throw ApiError.unauthorized("User no longer exists")

  return user
}

export const register = async ({ username, email, password }) => {
  const user = await User.create({ username, email, password })
  return { user, token: signToken(user._id) }
}

export const login = async ({ identifier, password }) => {
  const query = identifier.includes("@") ? { email: identifier.toLowerCase() } : { username: identifier }
  const user = await User.findOne(query).select("+password")

  // The same message for "no such user" and "wrong password" so the endpoint
  // can't be used to discover which accounts exist.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid credentials")
  }

  return { user, token: signToken(user._id) }
}
