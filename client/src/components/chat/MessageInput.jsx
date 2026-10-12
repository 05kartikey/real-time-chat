import { useRef, useState } from "react"
import toast from "react-hot-toast"
import { FileText, Paperclip, Send, X } from "lucide-react"
import useChat from "../../hooks/useChat"
import useSocket from "../../hooks/useSocket"
import useTyping from "../../hooks/useTyping"
import { IconButton } from "../ui/Button"
import { getErrorMessage } from "../../services/api"
import { ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE, validateFile } from "../../utils/validation"
import { formatFileSize } from "../../utils/format"

const MAX_LENGTH = 4000

function MessageInput({ conversationId }) {
  const { sendMessage, sendAttachment } = useChat()
  const { isConnected } = useSocket()
  const { notifyTyping, stopTyping } = useTyping(conversationId)
  const [text, setText] = useState("")
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(null) // null when not uploading
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const isUploading = progress !== null
  const canSend = !isUploading && (file || text.trim())

  // Grow the textarea with its content, up to a limit
  const resize = () => {
    const el = textareaRef.current
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const handleChange = (e) => {
    setText(e.target.value)
    resize()
    if (e.target.value) notifyTyping()
    else stopTyping()
  }

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    e.target.value = "" // allow choosing the same file again
    if (!selected) return

    const error = validateFile(selected, { types: ATTACHMENT_TYPES, maxSize: MAX_ATTACHMENT_SIZE })
    if (error) return toast.error(error)
    setFile(selected)
    textareaRef.current?.focus()
  }

  const reset = () => {
    setText("")
    setFile(null)
    requestAnimationFrame(resize)
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!canSend) return
    stopTyping()
    const content = text.trim()

    if (!file) {
      sendMessage(conversationId, content)
      reset()
      return
    }

    // Files go over HTTP (multipart with progress), the result still
    // arrives for everyone else as a normal message:new socket event.
    setProgress(0)
    try {
      await sendAttachment(conversationId, { file, content }, setProgress)
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err, "Upload failed"))
    } finally {
      setProgress(null)
    }
  }

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line (and never interrupt IME composition)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-3 py-3 sm:px-4">
      {file && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
          <FileText className="size-6 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            {isUploading ? (
              <div
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            ) : (
              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
            )}
          </div>
          {!isUploading && (
            <IconButton label="Remove attachment" onClick={() => setFile(null)}>
              <X className="size-4" />
            </IconButton>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <IconButton label="Attach a file" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <Paperclip className="size-5" />
        </IconButton>
        <input
          ref={fileInputRef}
          type="file"
          accept={ATTACHMENT_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
          tabIndex={-1}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder={file ? "Add a caption…" : isConnected ? "Type a message" : "Waiting for connection…"}
          aria-label="Message"
          className="scrollbar-thin max-h-40 flex-1 resize-none rounded-2xl bg-slate-100 px-4 py-2 text-sm leading-5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
        >
          <Send className="size-4" />
        </button>
      </div>
    </form>
  )
}

export default MessageInput
