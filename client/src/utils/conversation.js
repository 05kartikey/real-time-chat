// Helpers for presenting a conversation from the current user's point of view.

export const getOtherParticipant = (conversation, myId) =>
  conversation.participants.find((p) => p.user.id !== myId)?.user

export const getConversationTitle = (conversation, myId) => {
  if (conversation.type === "group") return conversation.name
  return getOtherParticipant(conversation, myId)?.username ?? "Unknown user"
}

export const getMyRole = (conversation, myId) =>
  conversation.participants.find((p) => p.user.id === myId)?.role

export const getLastActivity = (conversation) =>
  new Date(conversation.lastMessage?.createdAt ?? conversation.updatedAt).getTime()

// One-line preview for the sidebar
export const getMessagePreview = (message, myId) => {
  if (!message) return "No messages yet"
  if (message.deletedAt) return "Message deleted"
  if (message.type === "system") return message.content

  const prefix = message.sender?.id === myId ? "You: " : ""
  if (message.type === "image") return `${prefix}📷 ${message.content || "Photo"}`
  if (message.type === "file") return `${prefix}📎 ${message.attachment?.name ?? "File"}`
  return `${prefix}${message.content}`
}
