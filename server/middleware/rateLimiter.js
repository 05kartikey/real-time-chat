import { rateLimit } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import { redis, redisReady } from "../config/redis.js"

// Counters live in Redis so limits hold across every server instance,
// not just the one a request happens to land on.
const createLimiter = ({ prefix, windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
    store: new RedisStore({
      prefix: `rl:${prefix}:`,
      // The store loads its Lua scripts as soon as it's created, which is
      // before server.js has connected Redis, so wait for the connection.
      sendCommand: async (...args) => {
        await redisReady
        return redis.sendCommand(args)
      },
    }),
  })

export const authLimiter = createLimiter({
  prefix: "auth",
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many attempts, please try again in 15 minutes",
})

export const apiLimiter = createLimiter({
  prefix: "api",
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Too many requests, please slow down",
})
