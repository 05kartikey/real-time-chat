import express from "express"
import cors from "cors"
import authRoutes from "./routes/authRoutes.js"
import protect from "./middleware/auth.js"
import errorHandler from "./middleware/errorHandler.js"

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())

app.get("/api/health", (_req, res) => res.json({ status: "ok" }))
app.use("/api/auth", authRoutes)
app.get("/api/me", protect, (req, res) => res.json({ user: req.user }))

app.use(errorHandler)

export default app
