import { createClient } from "redis"
import env from "./env.js"
import logger from "../utils/logger.js"
import { createMemoryRedis } from "./memoryRedis.js"

export const usingRedis = env.hasRedis

// General-purpose client: presence, rate limiting. Without REDIS_URL (dev
// only) an in-memory stand-in with the same API is used instead.
export const redis = usingRedis ? createClient({ url: env.REDIS_URL }) : createMemoryRedis()

// A connection in subscriber mode cannot run other commands, so the
// Socket.IO adapter needs its own dedicated pub/sub pair.
export const pubClient = usingRedis ? redis.duplicate() : null
export const subClient = usingRedis ? redis.duplicate() : null

const clients = usingRedis ? { redis, pubClient, subClient } : {}

for (const [name, client] of Object.entries(clients)) {
  client.on("error", (err) => logger.error({ err }, `Redis (${name}) error`))
}

// Resolves once connected. Lets modules created at import time (like the
// rate-limit store) queue their first commands until Redis is up.
let markReady
export const redisReady = new Promise((resolve) => {
  markReady = resolve
})

export const connectRedis = async () => {
  if (!usingRedis) {
    logger.warn("REDIS_URL not set: using in-memory stores (fine for development, single instance only)")
    markReady()
    return
  }
  await Promise.all(Object.values(clients).map((client) => client.connect()))
  markReady()
  logger.info("Redis connected")
}

export const disconnectRedis = async () => {
  await Promise.all(Object.values(clients).filter((c) => c.isOpen).map((client) => client.quit()))
}
