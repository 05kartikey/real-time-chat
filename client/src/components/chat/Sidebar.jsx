import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { LogOut, MessageSquare, Plus, Search } from "lucide-react"
import useAuth from "../../hooks/useAuth"
import useChat from "../../hooks/useChat"
import Avatar from "../ui/Avatar"
import Button, { IconButton } from "../ui/Button"
import Spinner from "../ui/Spinner"
import ConversationItem from "./ConversationItem"
import NewChatModal from "./NewChatModal"
import { getConversationTitle, getOtherParticipant } from "../../utils/conversation"

const EMPTY = []

function Sidebar() {
  const { user, logout } = useAuth()
  const { conversationList, conversationsStatus, myId, online, typing } = useChat()
  const [filter, setFilter] = useState("")
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return conversationList
    return conversationList.filter((c) => getConversationTitle(c, myId).toLowerCase().includes(q))
  }, [conversationList, filter, myId])

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg" title="Edit profile">
          <Avatar name={user.username} src={user.avatar} size="sm" />
          <span className="truncate font-semibold">{user.username}</span>
        </Link>
        <IconButton label="New chat" onClick={() => setIsNewChatOpen(true)}>
          <Plus className="size-5" />
        </IconButton>
        <IconButton label="Log out" onClick={logout}>
          <LogOut className="size-5" />
        </IconButton>
      </header>

      <div className="px-4 py-3">
        <label className="relative block">
          <span className="sr-only">Filter conversations</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-lg bg-slate-100 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
      </div>

      <nav aria-label="Conversations" className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2">
        {conversationsStatus === "loading" && (
          <div className="flex justify-center py-8">
            <Spinner className="size-6" />
          </div>
        )}

        {conversationsStatus === "ready" && conversationList.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <MessageSquare className="size-10 text-slate-300" />
            <p className="text-sm text-slate-500">No conversations yet. Find someone to talk to.</p>
            <Button onClick={() => setIsNewChatOpen(true)}>Start a chat</Button>
          </div>
        )}

        {conversationsStatus === "ready" && conversationList.length > 0 && visible.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No conversations match “{filter}”.</p>
        )}

        {visible.map((conversation) => {
          const other = conversation.type === "direct" ? getOtherParticipant(conversation, myId) : null
          const typers = typing[conversation.id]
          return (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              myId={myId}
              isOnline={Boolean(other && online[other.id])}
              typingNames={typers ? Object.values(typers) : EMPTY}
            />
          )
        })}
      </nav>

      {isNewChatOpen && <NewChatModal onClose={() => setIsNewChatOpen(false)} />}
    </div>
  )
}

export default Sidebar
