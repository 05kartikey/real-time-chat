// env must be imported first: it loads .env and validates it before any
// other module reads configuration.
import env from "./config/env.js"
import { createServer } from "http"
import mongoose from "mongoose"
import app from "./app.js"
import connectDB from "./config/db.js"
import { connectRedis, disconnectRedis } from "./config/redis.js"
import { initSocket } from "./sockets/index.js"
import logger from "./utils/logger.js"

const SHUTDOWN_TIMEOUT_MS = 10_000

const start = async () => {
  await connectDB()
  await connectRedis()

  const httpServer = createServer(app)
  const io = initSocket(httpServer)

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  })

  // Graceful shutdown: stop accepting connections, let in-flight work
  // finish, then close database connections. Force-exit if it hangs.
  let shuttingDown = false
  const shutdown = async (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info(`${signal} received, shutting down`)

    setTimeout(() => {
      logger.error("Shutdown timed out, forcing exit")
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS).unref()

    try {
      // Closes every socket and the underlying HTTP server
      await io.close()
      await mongoose.disconnect()
      await disconnectRedis()
      logger.info("Shutdown complete")
      process.exit(0)
    } catch (err) {
      logger.error({ err }, "Error during shutdown")
      process.exit(1)
    }
  }

  process.on("SIGINT", () => shutdown("SIGINT"))
  process.on("SIGTERM", () => shutdown("SIGTERM"))
}

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection")
})

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server")
  process.exit(1)
})
