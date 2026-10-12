import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { IconButton } from "./Button"

function Modal({ title, onClose, children, footer }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Escape closes; focus moves into the dialog on open and returns on close.
  // Runs once (the ref holds the latest onClose), so re-renders never steal
  // focus from inputs inside the dialog.
  useEffect(() => {
    const previouslyFocused = document.activeElement
    dialogRef.current?.focus()

    const onKeyDown = (e) => e.key === "Escape" && onCloseRef.current()
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl outline-none sm:max-w-md sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </header>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}

export default Modal
