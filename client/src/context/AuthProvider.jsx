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

  // All tabs share one localStorage token. If another tab logs in as someone
  // else or logs out, follow it; otherwise this tab would keep showing the old
  // user while its requests carry the new user's token.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== tokenStorage.key) return

      if (!e.newValue) {
        setUser(null)
        toast("You were logged out in another tab", { id: "session-sync" })
        return
      }

      authApi
        .me()
        .then((me) => {
          setUser(me)
          toast(`Now signed in as ${me.username} (changed in another tab)`, { id: "session-sync" })
        })
        .catch(() => setUser(null))
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
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
