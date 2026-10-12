import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { AuthContext } from "./contexts"
import { authApi } from "../services/chatApi"
import { setUnauthorizedHandler } from "../services/api"
import tokenStorage from "../utils/tokenStorage"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // With a stored token we don't know who the user is until /auth/me
  // answers. Routes wait on this instead of redirecting to /login early.
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStorage.get()))

  useEffect(() => {
    if (!tokenStorage.get()) return

    let cancelled = false
    authApi
      .me()
      .then((me) => !cancelled && setUser(me))
      .catch(() => tokenStorage.clear())
      .finally(() => !cancelled && setIsLoading(false))

    return () => {
      cancelled = true
    }
  }, [])

  const startSession = useCallback(({ token, user }) => {
    tokenStorage.set(token)
    setUser(user)
  }, [])

  const login = useCallback(
    async (identifier, password) => startSession(await authApi.login(identifier, password)),
    [startSession]
  )

  const register = useCallback(
    async (username, email, password) => startSession(await authApi.register(username, email, password)),
    [startSession]
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  // Any 401 on an authenticated request means the token expired or was revoked
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      toast.error("Your session has expired. Please log in again.", { id: "session-expired" })
    })
  }, [logout])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, updateUser: setUser }),
    [user, isLoading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
