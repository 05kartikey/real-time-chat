import { Component } from "react"
import Button from "./ui/Button"

// Catches render errors anywhere below it so one broken component shows a
// recovery screen instead of a blank page. (Error boundaries still have to
// be class components.)
class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-slate-500">An unexpected error occurred. Reloading usually fixes it.</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    )
  }
}

export default ErrorBoundary
