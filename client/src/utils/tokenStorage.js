// The JWT lives in localStorage so a page refresh keeps you signed in.
// Trade-off: any script running on the page (an XSS bug) could read it. The
// README explains this and the httpOnly-cookie alternative.
const KEY = "token"

const tokenStorage = {
  key: KEY,
  get() {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(KEY, token)
    } catch {
      // Storage can be unavailable (private mode, blocked cookies)
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // ignore
    }
  },
}

export default tokenStorage
