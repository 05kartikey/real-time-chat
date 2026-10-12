import clsx from "clsx"
import { LoaderCircle } from "lucide-react"

function Spinner({ className, label = "Loading" }) {
  return (
    <LoaderCircle role="status" aria-label={label} className={clsx("animate-spin text-indigo-600", className)} />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}

export default Spinner
