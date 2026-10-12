import { Server } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import env from "../config/env.js"
import { pubClient, subClient } from "../config/redis.js"
import Conversation from "../models/Conversation.js"
import logger from "../utils/logger.js"
import { setIO, rooms } from "./io.js"
import socketAuth from "./middleware/socketAuth.js"
import registerMessageHandlers from "./handlers/messageHandlers.js"
import registerTypingHandlers from "./handlers/typingHandlers.js"
import registerPresenceHandlers from "./handlers/presenceHandlers.js"

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGINS },
    // The Redis adapter relays broadcasts between server instances, so a
    // message sent to a user connected to instance A reaches a user on B.
    adapter: createAdapter(pubClient, subClient),
  })

  io.use(socketAuth)

  io.on("connection", async (socket) => {
    const { user } = socket.data
    logger.debug({ userId: user.id, socketId: socket.id }, "Socket connected")

    // Register listeners synchronously so no early event is missed
    // while the async setup below is still running.
    registerMessageHandlers(io, socket)
    registerTypingHandlers(io, socket)

    try {
      socket.join(rooms.user(user.id))

      // The server decides which rooms a socket is in, based on the database.
      // Clients can never join a room by name.
      const conversations = await Conversation.find({ "participants.user": user.id })
        .select("participants.user")
        .lean()
      // The client may have gone away while we were querying
      if (socket.disconnected) return
      socket.join(conversations.map((c) => rooms.conversation(c._id)))

      registerPresenceHandlers(io, socket, conversations)
    } catch (err) {
      logger.error({ err }, "Socket setup failed")
      socket.disconnect(true)
    }

    socket.on("disconnect", (reason) => {
      logger.debug({ userId: user.id, socketId: socket.id, reason }, "Socket disconnected")
    })
  })

  setIO(io)
  return io
}
