import User from "../../models/User.js"
import * as presenceService from "../../services/presenceService.js"
import logger from "../../utils/logger.js"
import { rooms } from "../io.js"

// If a server crashes or is hard-killed (e.g. a dev restart), its sockets
// never fire "disconnect" and their ids stay in Redis, which would keep a
// user "online" forever. fetchSockets asks every instance (via the adapter)
// which sockets really exist, so stale entries get pruned.
const pruneDeadConnections = async (io, userId) => {
  const socketIds = await presenceService.getConnections(userId)
  if (socketIds.length === 0) return

  const live = new Set((await io.in(socketIds).fetchSockets()).map((s) => s.id))
  const dead = socketIds.filter((id) => !live.has(id))
  if (dead.length) await presenceService.removeConnections(userId, dead)
}

const conversationRoomsOf = (socket) => [...socket.rooms].filter(rooms.isConversation)

const registerPresenceHandlers = (io, socket, conversations) => {
  const userId = socket.data.user.id

  const broadcast = (convRooms, payload) => {
    if (convRooms.length) io.to(convRooms).emit("presence:update", payload)
  }

  const onConnect = async () => {
    await pruneDeadConnections(io, userId)

    const cameOnline = await presenceService.addConnection(userId, socket.id)
    if (cameOnline) broadcast(conversationRoomsOf(socket), { userId, online: true })

    // Give the new socket the current state of everyone it chats with
    const contactIds = new Set(
      conversations.flatMap((c) => c.participants.map((p) => p.user.toString()))
    )
    contactIds.delete(userId)
    const onlineUserIds = await presenceService.filterOnline([...contactIds])
    socket.emit("presence:snapshot", { onlineUserIds })
  }

  const connected = onConnect().catch((err) => logger.error({ err }, "Presence connect failed"))

  // "disconnecting" fires while socket.rooms is still populated, so we can
  // capture who to notify before the socket leaves its rooms.
  socket.on("disconnecting", () => {
    const convRooms = conversationRoomsOf(socket)

    connected
      .then(async () => {
        let wentOffline = await presenceService.removeConnection(userId, socket.id)
        if (!wentOffline) {
          await pruneDeadConnections(io, userId)
          wentOffline = !(await presenceService.isOnline(userId))
        }
        if (!wentOffline) return

        const lastSeen = new Date()
        await User.updateOne({ _id: userId }, { lastSeen })
        broadcast(convRooms, { userId, online: false, lastSeen })
      })
      .catch((err) => logger.error({ err }, "Presence disconnect failed"))
  })
}

export default registerPresenceHandlers
