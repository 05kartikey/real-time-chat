import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const SERVER_URL = "http://localhost:5000"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxying keeps the browser on a single origin in development,
    // so there's no CORS and the socket connects to the same host.
    proxy: {
      "/api": { target: SERVER_URL, changeOrigin: true },
      "/socket.io": { target: SERVER_URL, changeOrigin: true, ws: true },
    },
  },
})
