import { useId } from "react"
import clsx from "clsx"

function Input({ label, error, hint, className, as = "input", ...props }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const Field = as

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <Field
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={clsx(
          "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm",
          "placeholder:text-slate-400 focus:outline-none focus:ring-2",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export default Input
