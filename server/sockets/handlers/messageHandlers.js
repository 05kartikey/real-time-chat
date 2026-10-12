import * as messageService from "../../services/messageService.js"
import * as conversationService from "../../services/conversationService.js"
import { sendMessageSchema, conversationEventSchema } from "../../validators/messageSchemas.js"
import { withAck, consumeRateLimit } from "../utils.js"

const registerMessageHandlers = (_io, socket) => {
  const { user } = socket.data

  // Client → server with an acknowledgement, so the sender knows whether
  // their optimistic message was actually saved.
  socket.on(
    "message:send",
    withAck(async (payload) => {
      const data = sendMessageSchema.parse(payload)

      await consumeRateLimit(`msg:${user.id}`, {
        limit: 20,
        windowSeconds: 10,
        message: "You're sending messages too fast",
      })

      // The same service the REST API uses: one place for validation,
      // authorization and persistence, whichever transport delivers it.
      const message = await messageService.sendText({ senderId: user.id, ...data })
      return { message }
    })
  )

  socket.on(
    "conversation:read",
    withAck(async (payload) => {
      const { conversationId } = conversationEventSchema.parse(payload)
      return conversationService.markRead(user.id, conversationId)
    })
  )
}

export default registerMessageHandlers
