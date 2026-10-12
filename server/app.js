import express from "express"
import cors from "cors"
import helmet from "helmet"
import mongoose from "mongoose"
import { pinoHttp } from "pino-http"
import env from "./config/env.js"
import { redis } from "./config/redis.js"
import logger from "./utils/logger.js"
import { apiLimiter } from "./middleware/rateLimiter.js"
import notFound from "./middleware/notFound.js"
import errorHandler from "./middleware/errorHandler.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import conversationRoutes from "./routes/conversationRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"

const app = express()

// Behind a reverse proxy (Nginx, Render, etc.), trust the first hop's
// X-Forwarded-For so rate limiting sees the real client IP.
app.set("trust proxy", 1)

app.use(helmet())
app.use(cors({ origin: env.CLIENT_ORIGINS }))
app.use(express.json({ limit: "100kb" }))
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
    customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
  })
)

app.get("/api/v1/health", (_req, res) => {
  const mongo = mongoose.connection.readyState === 1 ? "up" : "down"
  const redisStatus = redis.isReady ? "up" : "down"
  const healthy = mongo === "up" && redisStatus === "up"

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    mongo,
    redis: redisStatus,
    uptime: Math.round(process.uptime()),
  })
})

app.use("/api/v1", apiLimiter)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/conversations", conversationRoutes)
app.use("/api/v1/messages", messageRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
