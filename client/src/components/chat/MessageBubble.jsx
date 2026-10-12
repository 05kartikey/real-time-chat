import { memo, useState } from "react"
import clsx from "clsx"
import toast from "react-hot-toast"
import { Check, CircleAlert, Clock, Download, FileText, Pencil, RotateCw, Trash2 } from "lucide-react"
import Avatar from "../ui/Avatar"
import { formatFileSize, formatMessageTime } from "../../utils/format"
import { getErrorMessage } from "../../services/api"

function Attachment({ message, onMediaLoad }) {
  const { attachment } = message
  if (!attachment) return null

  if (message.type === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={attachment.url}
          alt={attachment.name}
          onLoad={onMediaLoad}
          className="max-h-72 w-full max-w-xs rounded-lg object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.name}
      className="flex items-center gap-3 rounded-lg bg-black/5 p-2.5 hover:bg-black/10"
    >
      <FileText className="size-8 shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
      </div>
      <Download className="size-4 shrink-0 opacity-70" />
    </a>
  )
}

function EditForm({ initial, onSave, onCancel }) {
  const [value, setValue] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)

  const save = async () => {
    const content = value.trim()
    if (!content || content === initial) return onCancel()
    setIsSaving(true)
    try {
      await onSave(content)
      onCancel()
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't edit the message"))
      setIsSaving(false)
    }
  }

  return (
    <div className="w-64 max-w-full">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            save()
          }
          if (e.key === "Escape") onCancel()
        }}
        autoFocus
        rows={3}
        maxLength={4000}
        disabled={isSaving}
        aria-label="Edit message"
        className="w-full resize-none rounded-md bg-white p-2 text-sm text-slate-900 focus:outline-none"
      />
      <div className="mt-1 flex justify-end gap-2 text-xs">
        <button type="button" onClick={onCancel} className="opacity-80 hover:underline">
          Cancel
        </button>
        <button type="button" onClick={save} disabled={isSaving} className="font-semibold hover:underline">
          Save
        </button>
      </div>
    </div>
  )
}

function StatusIcon({ status }) {
  if (status === "pending") return <Clock className="size-3" aria-label="Sending" />
  if (status === "failed") return <CircleAlert className="size-3 text-rose-300" aria-label="Failed to send" />
  return <Check className="size-3" aria-label="Sent" />
}

const MessageBubble = memo(function MessageBubble({
  message,
  isMine,
  showSender,
  showAvatar,
  seenLabel,
  onRetry,
  onEdit,
  onDelete,
  onMediaLoad,
}) {
  const [isEditing, setIsEditing] = useState(false)

  if (message.type === "system") {
    return (
      <div className="my-2 flex justify-center">
        <p className="rounded-full bg-slate-200/70 px-3 py-1 text-xs text-slate-600">{message.content}</p>
      </div>
    )
  }

  const isDeleted = Boolean(message.deletedAt)
  const canModify = isMine && !isDeleted && !message.status

  const handleDelete = async () => {
    if (!window.confirm("Delete this message for everyone?")) return
    try {
      await onDelete(message.id)
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete the message"))
    }
  }

  return (
    <div className={clsx("group flex items-end gap-2", isMine ? "justify-end" : "justify-start")}>
      {!isMine && (
        <div className="w-8 shrink-0">
          {showAvatar && <Avatar name={message.sender?.username} src={message.sender?.avatar} size="sm" />}
        </div>
      )}

      {canModify && !isEditing && (
        <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          {message.type === "text" && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              aria-label="Edit message"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-rose-600"
            aria-label="Delete message"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      <div className={clsx("flex max-w-[80%] flex-col sm:max-w-[65%]", isMine ? "items-end" : "items-start")}>
        <div
          className={clsx(
            "rounded-2xl px-3 py-2 shadow-sm",
            isMine ? "rounded-br-md text-white" : "rounded-bl-md bg-white text-slate-900",
            isMine && (message.status === "failed" ? "bg-rose-600" : "bg-indigo-600"),
            message.status === "pending" && "opacity-70"
          )}
        >
          {showSender && !isMine && (
            <p className="mb-0.5 text-xs font-semibold text-indigo-600">{message.sender?.username}</p>
          )}

          {isDeleted ? (
            <p className="text-sm italic opacity-70">This message was deleted</p>
          ) : isEditing ? (
            <EditForm
              initial={message.content}
              onSave={(content) => onEdit(message.id, content)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-1.5">
              <Attachment message={message} onMediaLoad={onMediaLoad} />
              {/* Rendered as text, never as HTML, so user content can't inject markup */}
              {message.content && <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>}
            </div>
          )}

          <div
            className={clsx(
              "mt-0.5 flex items-center justify-end gap-1 text-[11px]",
              isMine ? "text-indigo-100" : "text-slate-400"
            )}
          >
            {message.editedAt && !isDeleted && <span>edited</span>}
            <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
            {isMine && <StatusIcon status={message.status} />}
          </div>
        </div>

        {message.status === "failed" && (
          <button
            type="button"
            onClick={() => onRetry(message.clientId)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
          >
            <RotateCw className="size-3" /> Not sent. Tap to retry
          </button>
        )}
        {seenLabel && <p className="mt-0.5 text-[11px] text-slate-400">{seenLabel}</p>}
      </div>
    </div>
  )
})

export default MessageBubble
