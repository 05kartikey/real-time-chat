import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import ProtectedRoute from "./routes/ProtectedRoute"
import PublicRoute from "./routes/PublicRoute"
import { FullPageSpinner } from "./components/ui/Spinner"

// Route-level code splitting: each page is downloaded only when first visited
const AppShell = lazy(() => import("./components/layout/AppShell"))
const LoginPage = lazy(() => import("./pages/LoginPage"))
const RegisterPage = lazy(() => import("./pages/RegisterPage"))
const ChatPage = lazy(() => import("./pages/ChatPage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"))

function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/chat/:conversationId?" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
