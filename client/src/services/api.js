import axios from "axios"
import tokenStorage from "../utils/tokenStorage"

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api/v1`,
  timeout: 30_000,
})

// Attach the token to every request
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// AuthProvider registers what to do when the server rejects our token.
// A setter keeps this module free of any React dependency.
let handleUnauthorized = () => {}
export const setUnauthorizedHandler = (handler) => {
  handleUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only an expired/invalid session, not e.g. a wrong password on login
    if (error.response?.status === 401 && tokenStorage.get()) handleUnauthorized()
    return Promise.reject(error)
  }
)

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error.response?.data?.message) return error.response.data.message
  if (error.request && !error.response) return "Can't reach the server. Check your connection."
  return fallback
}

// Server validation errors → { fieldName: message } for inline form errors
export const getFieldErrors = (error) =>
  Object.fromEntries((error.response?.data?.details ?? []).map((d) => [d.field, d.message]))

export default api
