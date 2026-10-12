import { z } from "zod"
import { objectId } from "../utils/objectId.js"

const content = z.string().trim().min(1, "Message can't be empty").max(4000, "Message is too long")
const clientId = z.string().max(64).optional()

export const messageParams = z.object({ id: objectId })

export const editMessageSchema = z.object({ content })

// multipart/form-data fields that accompany an uploaded file
export const attachmentBodySchema = z.object({
  content: z.string().trim().max(4000).optional().default(""),
  clientId,
})

// Socket.IO payloads are validated just like HTTP bodies
export const sendMessageSchema = z.object({ conversationId: objectId, content, clientId })

export const conversationEventSchema = z.object({ conversationId: objectId })
