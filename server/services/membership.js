import Conversation from "../models/Conversation.js"
import ApiError from "../utils/ApiError.js"

// Non-members get a 404 rather than a 403 so they can't probe which
// conversation ids exist.
const notFound = () => ApiError.notFound("Conversation not found")

export const assertMember = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({ _id: conversationId, "participants.user": userId })
  if (!conversation) throw notFound()
  return conversation
}

// Cheaper variant for hot paths (every sent message) that don't need the document.
export const assertIsMember = async (conversationId, userId) => {
  const exists = await Conversation.exists({ _id: conversationId, "participants.user": userId })
  if (!exists) throw notFound()
}

export const assertGroupAdmin = async (conversationId, userId) => {
  const conversation = await assertMember(conversationId, userId)

  if (conversation.type !== "group") {
    throw ApiError.badRequest("This action is only available in group chats")
  }
  if (conversation.getParticipant(userId).role !== "admin") {
    throw ApiError.forbidden("Only group admins can do that")
  }

  return conversation
}
