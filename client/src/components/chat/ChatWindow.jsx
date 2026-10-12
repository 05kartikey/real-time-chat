import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import useChat from "../../hooks/useChat"
import { conversationsApi } from "../../services/chatApi"
import { FullPageSpinner } from "../ui/Spinner"
import ChatHeader from "./ChatHeader"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import GroupInfoModal from "./GroupInfoModal"

const EMPTY_THREAD = { items: [], hasMore: true, status: "idle" }

function ChatWindow({ conversationId }) {
  const { conversations, conversationsStatus, messages, setActiveConversation, loadMessages, upsertConversation } =
    useChat()
  const navigate = useNavigate()
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const conversation = conversations[conversationId]
  const thread = messages[conversationId] ?? EMPTY_THREAD
  const needsMessages = Boolean(conversation) && thread.status === "idle"

  // Marks this conversation as the one on screen (for unread counts, read
  // receipts and notifications) for as long as this component is mounted.
  useEffect(() => {
    setActiveConversation(conversationId)
    return () => setActiveConversation(null)
  }, [conversationId, setActiveConversation])

  useEffect(() => {
    if (needsMessages) loadMessages(conversationId)
  }, [needsMessages, conversationId, loadMessages])

  // Deep link to a conversation that isn't in the sidebar list (e.g. an
  // empty DM): fetch it directly, or bail out if we can't access it.
  const isMissing = conversationsStatus === "ready" && !conversation
  useEffect(() => {
    if (!isMissing) return
    let cancelled = false
    conversationsApi
      .get(conversationId)
      .then((c) => !cancelled && upsertConversation(c))
      .catch(() => {
        if (cancelled) return
        toast.error("Conversation not found")
        navigate("/chat", { replace: true })
      })
    return () => {
      cancelled = true
    }
  }, [isMissing, conversationId, upsertConversation, navigate])

  if (!conversation) return <FullPageSpinner />

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-slate-50">
      <ChatHeader conversation={conversation} onShowInfo={() => setIsInfoOpen(true)} />
      <MessageList conversation={conversation} thread={thread} />
      <MessageInput conversationId={conversationId} />
      {isInfoOpen && conversation.type === "group" && (
        <GroupInfoModal conversation={conversation} onClose={() => setIsInfoOpen(false)} />
      )}
    </div>
  )
}

export default ChatWindow
