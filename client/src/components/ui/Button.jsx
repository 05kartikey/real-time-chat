import clsx from "clsx"
import Spinner from "./Spinner"

const VARIANTS = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600",
}

function Button({ variant = "primary", loading = false, disabled, className, children, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {loading && <Spinner className="size-4 text-current" />}
      {children}
    </button>
  )
}

export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition",
        "hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
