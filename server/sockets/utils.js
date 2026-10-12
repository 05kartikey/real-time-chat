import ApiError from "../utils/ApiError.js"
import logger from "../utils/logger.js"
import { redis } from "../config/redis.js"
import { normalizeError } from "../middleware/errorHandler.js"

// Wraps an async event handler in a request/response contract:
// ack({ ok: true, ...result }) or ack({ ok: false, error }). This is the
// socket equivalent of the HTTP error handler. Without it, a rejected
// promise in a handler would be an unhandled rejection.
export const withAck = (handler) => async (payload, ack) => {
  const respond = typeof ack === "function" ? ack : () => {}

  try {
    const result = await handler(payload)
    respond({ ok: true, ...result })
  } catch (err) {
    const apiError = normalizeError(err)
    if (!apiError) logger.error({ err }, "Unhandled socket handler error")

    respond({
      ok: false,
      error: apiError?.message ?? "Something went wrong",
      ...(apiError?.details && { details: apiError.details }),
    })
  }
}

// Fixed-window limiter in Redis, so it holds across tabs and server instances.
export const consumeRateLimit = async (key, { limit, windowSeconds, message }) => {
  const redisKey = `rl:socket:${key}`
  const [count] = await redis.multi().incr(redisKey).expire(redisKey, windowSeconds, "NX").exec()

  if (count > limit) throw ApiError.tooManyRequests(message)
}
