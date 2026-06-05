import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { createServer } from "http"
import { Server } from "socket.io"
import app from "./app.js"
import connectDB from "./config/db.js"
import registerSocketHandlers from "./sockets/index.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, "../.env") })

const PORT = process.env.PORT || 5000

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
})

registerSocketHandlers(io)

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
})
