const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`)

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId)
      console.log(`${socket.id} joined room: ${roomId}`)
    })

    socket.on("sendMessage", (data) => {
      io.to(data.roomId).emit("newMessage", data)
    })

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`)
    })
  })
}

export default registerSocketHandlers
