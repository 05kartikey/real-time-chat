import { authenticateToken } from "../../services/authService.js"

// Runs once per connection, during the handshake, before any event handler.
// It uses the same token check as the HTTP `protect` middleware.
const socketAuth = async (socket, next) => {
  try {
    const user = await authenticateToken(socket.handshake.auth?.token)
    // socket.data must be plain data: with the Redis adapter it can be
    // serialized and read by other server instances (fetchSockets).
    socket.data.user = { id: user.id, username: user.username, avatar: user.avatar.url }
    next()
  } catch {
    // The client checks for this exact message to decide whether to log out
    next(new Error("UNAUTHORIZED"))
  }
}

export default socketAuth
