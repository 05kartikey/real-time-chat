import { io } from "socket.io-client"
import tokenStorage from "../utils/tokenStorage"

// A single shared connection for the whole app. `auth` is a callback so
// every (re)connection reads the current token rather than a stale one.
const socket = io(import.meta.env.VITE_API_URL || undefined, {
  autoConnect: false,
  auth: (cb) => cb({ token: tokenStorage.get() }),
})

export default socket
