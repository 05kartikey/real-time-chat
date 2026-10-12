import { Link } from "react-router-dom"

function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-bold text-indigo-600">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
        Go home
      </Link>
    </div>
  )
}

export default NotFoundPage
