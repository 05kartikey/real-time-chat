import { createContext } from "react"

// Context objects live in their own module so provider files only export
// components (which keeps React Fast Refresh working).
export const AuthContext = createContext(null)
export const SocketContext = createContext(null)
export const ChatContext = createContext(null)
