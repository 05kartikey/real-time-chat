import { createClient } from "redis"
import env from "./env.js"
import logger from "../utils/logger.js"

// General-purpose client: presence, rate limiting.
export const redis = createClient({ url: env.REDIS_URL })

// A connection in subscriber mode cannot run other commands, so the
// Socket.IO adapter needs its own dedicated pub/sub pair.
export const pubClient = redis.duplicate()
export const subClient = redis.duplicate()

const clients = { redis, pubClient, subClient }

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
  await Promise.all(Object.values(clients).map((client) => client.connect()))
  markReady()
  logger.info("Redis connected")
}

export const disconnectRedis = async () => {
  await Promise.all(Object.values(clients).filter((c) => c.isOpen).map((client) => client.quit()))
}
