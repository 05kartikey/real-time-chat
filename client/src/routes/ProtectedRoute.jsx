import { Navigate, Outlet, useLocation } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { FullPageSpinner } from "../components/ui/Spinner"

// Waits for the session check, then either renders the page or sends the
// user to /login, remembering where they were headed.
function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export default ProtectedRoute
