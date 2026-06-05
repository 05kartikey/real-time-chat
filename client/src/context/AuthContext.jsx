import { createContext, useContext, useState } from "react"
import api from "../services/api"
import socket from "../socket"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password })
    localStorage.setItem("token", data.token)
    setToken(data.token)
    setUser(data.user)
    socket.connect()
  }

  const register = async (username, email, password) => {
    const { data } = await api.post("/api/auth/register", { username, email, password })
    localStorage.setItem("token", data.token)
    setToken(data.token)
    setUser(data.user)
    socket.connect()
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    socket.disconnect()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
