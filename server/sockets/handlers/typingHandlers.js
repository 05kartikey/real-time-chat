import { rooms } from "../io.js"
import { conversationEventSchema } from "../../validators/messageSchemas.js"

// Typing events are ephemeral: no database write, just a relay to the
// other members of the room.
const registerTypingHandlers = (_io, socket) => {
  const { user } = socket.data

  const relay = (event) => (payload) => {
    const parsed = conversationEventSchema.safeParse(payload)
    if (!parsed.success) return

    const { conversationId } = parsed.data
    const room = rooms.conversation(conversationId)

    // Room membership is the authorization check: sockets are only ever
    // joined to rooms of conversations their user belongs to.
    if (!socket.rooms.has(room)) return

    // socket.to() excludes the sender's own socket
    socket.to(room).emit(event, { conversationId, userId: user.id, username: user.username })
  }

  socket.on("typing:start", relay("typing:start"))
  socket.on("typing:stop", relay("typing:stop"))
}

export default registerTypingHandlers
