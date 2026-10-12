import { Navigate, Outlet, useLocation } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { FullPageSpinner } from "../components/ui/Spinner"

// Login/register pages: signed-in users go back to where they came from
function PublicRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (user) return <Navigate to={location.state?.from?.pathname ?? "/chat"} replace />
  return <Outlet />
}

export default PublicRoute
