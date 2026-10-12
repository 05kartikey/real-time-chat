import { Link } from "react-router-dom"
import { ArrowLeft, Info } from "lucide-react"
import useChat from "../../hooks/useChat"
import Avatar from "../ui/Avatar"
import { IconButton } from "../ui/Button"
import { getConversationTitle, getOtherParticipant } from "../../utils/conversation"
import { formatLastSeen } from "../../utils/format"

const describeTyping = (names) => {
  if (names.length === 1) return `${names[0]} is typing…`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`
  return "Several people are typing…"
}

function ChatHeader({ conversation, onShowInfo }) {
  const { myId, online, lastSeen, typing } = useChat()
  const isGroup = conversation.type === "group"
  const other = isGroup ? null : getOtherParticipant(conversation, myId)
  const title = getConversationTitle(conversation, myId)
  const typingNames = Object.values(typing[conversation.id] ?? {})

  let subtitle
  if (typingNames.length) {
    subtitle = <span className="text-indigo-600">{isGroup ? describeTyping(typingNames) : "typing…"}</span>
  } else if (isGroup) {
    const onlineCount = conversation.participants.filter((p) => p.user.id !== myId && online[p.user.id]).length
    subtitle = `${conversation.participants.length} members${onlineCount ? `, ${onlineCount} online` : ""}`
  } else if (other && online[other.id]) {
    subtitle = <span className="text-emerald-600">online</span>
  } else {
    subtitle = formatLastSeen(lastSeen[other?.id] ?? other?.lastSeen)
  }

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
      <Link
        to="/chat"
        className="-ml-1 inline-flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 md:hidden"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="size-5" />
      </Link>

      <Avatar name={title} src={other?.avatar} group={isGroup} online={Boolean(other && online[other.id])} />

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-semibold leading-tight">{title}</h1>
        <p className="truncate text-xs text-slate-500" aria-live="polite">
          {subtitle}
        </p>
      </div>

      {isGroup && (
        <IconButton label="Group info" onClick={onShowInfo}>
          <Info className="size-5" />
        </IconButton>
      )}
    </header>
  )
}

export default ChatHeader
