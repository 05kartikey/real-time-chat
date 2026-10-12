// Each tab keeps its own token in sessionStorage, so two tabs can be signed in
// as different users (handy for demos) without their requests getting mixed up.
// The latest login is also copied to localStorage so a brand-new tab starts
// signed in as that user; after that, the tab is independent.
//
// Trade-off: any script running on the page (an XSS bug) could read these.
// The README explains this and the httpOnly-cookie alternative.
const KEY = "token"

// Storage can be unavailable (private mode, blocked site data), so never throw
const read = (store) => {
  try {
    return store.getItem(KEY)
  } catch {
    return null
  }
}

const write = (store, value) => {
  try {
    if (value) store.setItem(KEY, value)
    else store.removeItem(KEY)
  } catch {
    // ignore
  }
}

const tokenStorage = {
  get() {
    let token = read(sessionStorage)
    if (!token) {
      // New tab: adopt the most recent login, then stay independent
      token = read(localStorage)
      if (token) write(sessionStorage, token)
    }
    return token
  },
  set(token) {
    write(sessionStorage, token)
    write(localStorage, token)
  },
  clear() {
    const token = read(sessionStorage)
    write(sessionStorage, null)
    // Don't sign new tabs in as someone who just logged out
    if (read(localStorage) === token) write(localStorage, null)
  },
}

export default tokenStorage
