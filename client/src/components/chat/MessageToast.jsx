import clsx from "clsx"
import toast from "react-hot-toast"
import Avatar from "../ui/Avatar"

// Notification for a message that arrives in a conversation you're not looking at
function MessageToast({ toast: t, sender, title, preview, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => {
        onOpen()
        toast.dismiss(t.id)
      }}
      className={clsx(
        "flex w-80 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl bg-white p-3 text-left shadow-lg ring-1 ring-slate-200 transition",
        t.visible ? "opacity-100" : "opacity-0"
      )}
    >
      <Avatar name={sender.username} src={sender.avatar} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        <p className="truncate text-sm text-slate-500">{preview}</p>
      </div>
    </button>
  )
}

export default MessageToast
