import mongoose from "mongoose"
import multer from "multer"
import jwt from "jsonwebtoken"
import { ZodError } from "zod"
import ApiError from "../utils/ApiError.js"
import env from "../config/env.js"

// Translates known library errors into ApiErrors so every failure reaches the
// client in the same shape: { message, details? }.
export const normalizeError = (err) => {
  if (err instanceof ApiError) return err

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }))
    return ApiError.badRequest("Validation failed", details)
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
    return ApiError.badRequest("Validation failed", details)
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid ${err.path}`)
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field"
    return ApiError.conflict(`That ${field} is already taken`, [{ field, message: "Already taken" }])
  }

  if (err instanceof jwt.TokenExpiredError) return ApiError.unauthorized("Session expired, please log in again")
  if (err instanceof jwt.JsonWebTokenError) return ApiError.unauthorized("Invalid token")

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.message
    return ApiError.badRequest(message)
  }

  if (err.type === "entity.parse.failed") return ApiError.badRequest("Malformed JSON body")
  if (err.type === "entity.too.large") return new ApiError(413, "Request body too large")

  return null
}

// Express recognises error middleware by its four-argument signature.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const apiError = normalizeError(err)

  if (!apiError) {
    req.log.error({ err }, "Unhandled error")
    return res.status(500).json({
      message: "Internal Server Error",
      ...(env.isDev && { stack: err.stack }),
    })
  }

  res.status(apiError.statusCode).json({
    message: apiError.message,
    ...(apiError.details && { details: apiError.details }),
  })
}

export default errorHandler
