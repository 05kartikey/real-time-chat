import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { SocketContext } from "./contexts"
import socket from "../socket"
import useAuth from "../hooks/useAuth"

// Mounted only inside protected routes: the socket connects when a user is
// signed in and disconnects when they log out (this provider unmounts).
export function SocketProvider({ children }) {
  const { logout } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [hasConnected, setHasConnected] = useState(false)

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true)
      setHasConnected(true)
    }
    const onDisconnect = () => setIsConnected(false)
    const onConnectError = (err) => {
      // The server's handshake middleware rejected our token
      if (err.message === "UNAUTHORIZED") {
        logout()
        toast.error("Your session has expired. Please log in again.", { id: "session-expired" })
      }
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", onConnectError)
    socket.connect()

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("connect_error", onConnectError)
      socket.disconnect()
    }
  }, [logout])

  const value = useMemo(() => ({ socket, isConnected, hasConnected }), [isConnected, hasConnected])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
