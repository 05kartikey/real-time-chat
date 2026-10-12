// Holds the Socket.IO server instance so the service layer can emit events
// (e.g. after a REST upload) without importing the socket bootstrap code.
let io = null

export const setIO = (instance) => {
  io = instance
}

export const getIO = () => {
  if (!io) throw new Error("Socket.IO has not been initialised")
  return io
}

// Room names are always built on the server, never accepted from clients.
export const rooms = {
  // Every socket (tab/device) of a single user
  user: (userId) => `user:${userId}`,
  // Every member currently connected to a conversation
  conversation: (conversationId) => `conv:${conversationId}`,
  isConversation: (room) => room.startsWith("conv:"),
}
