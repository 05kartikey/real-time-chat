import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./context/AuthProvider"
import ErrorBoundary from "./components/ErrorBoundary"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ className: "text-sm" }} />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
