import { useCallback, useEffect, useMemo, useReducer, useRef } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { ChatContext } from "./contexts"
import { chatReducer, initialChatState } from "./chatReducer"
import useAuth from "../hooks/useAuth"
import useSocketEvent from "../hooks/useSocketEvent"
import usePageVisibility from "../hooks/usePageVisibility"
import socket from "../socket"
import { conversationsApi, messagesApi } from "../services/chatApi"
import { getErrorMessage } from "../services/api"
import { createClientId } from "../utils/messages"
import { getConversationTitle, getLastActivity, getMessagePreview } from "../utils/conversation"
import MessageToast from "../components/chat/MessageToast"

const ACK_TIMEOUT_MS = 10_000
const TYPING_EXPIRY_MS = 5_000
const BASE_TITLE = "Chat"

// Id of the newest/oldest message that exists on the server (not optimistic)
const persistedIds = (items) => {
  const saved = items.filter((m) => !m.status)
  return { first: saved[0]?.id, last: saved.at(-1)?.id }
}

export function ChatProvider({ children }) {
  const { user } = useAuth()
  const myId = user.id
  const navigate = useNavigate()
  const isVisible = usePageVisibility()
  const [state, dispatch] = useReducer(chatReducer, initialChatState)

  // Socket callbacks are registered once, so they read current state from a
  // ref instead of capturing a stale copy in a closure.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  const inflightLoads = useRef(new Set())
  const typingTimers = useRef(new Map())
  const leavingIds = useRef(new Set())
  const hasConnectedBefore = useRef(false)

  // ── Loading ──────────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      dispatch({ type: "conversations/loaded", conversations: await conversationsApi.list() })
    } catch (err) {
      dispatch({ type: "conversations/failed" })
      toast.error(getErrorMessage(err, "Couldn't load your conversations"))
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const loadMessages = useCallback(async (conversationId, { older = false } = {}) => {
    const thread = stateRef.current.messages[conversationId]
    if (inflightLoads.current.has(conversationId)) return
    if (older && !thread?.hasMore) return

    inflightLoads.current.add(conversationId)
    dispatch({ type: "messages/loading", conversationId })
    try {
      const before = older ? persistedIds(thread.items).first : undefined
      const { messages, hasMore } = await messagesApi.list(conversationId, { before })
      dispatch({ type: "messages/loaded", conversationId, messages, hasMore, mode: older ? "older" : "replace" })
    } catch (err) {
      dispatch({ type: "messages/failed", conversationId })
      toast.error(getErrorMessage(err, "Couldn't load messages"))
    } finally {
      inflightLoads.current.delete(conversationId)
    }
  }, [])

  // After a reconnect, fetch whatever we missed while offline: the
  // conversation list, plus newer messages for every thread already open.
  const backfill = useCallback(async () => {
    await loadConversations()

    const threads = Object.entries(stateRef.current.messages).filter(([, t]) => t.items.length)
    await Promise.all(
      threads.map(async ([conversationId, thread]) => {
        const after = persistedIds(thread.items).last
        try {
          const { messages, hasMore } = await messagesApi.list(conversationId, { after, limit: 50 })
          // Too much missed: reload the latest page instead of patching a gap
          if (hasMore) return loadMessages(conversationId)
          dispatch({ type: "messages/loaded", conversationId, messages, mode: "newer" })
        } catch {
          // The conversation may be gone; the refreshed list already reflects that
        }
      })
    )
  }, [loadConversations, loadMessages])

  // ── Sending ──────────────────────────────────────────────────────────

  const emitMessage = useCallback(
    (message) => {
      const { conversation: conversationId, clientId, content } = message
      const fail = (error) => {
        dispatch({ type: "message/failed", conversationId, clientId })
        if (error) toast.error(error)
      }

      // Don't let socket.io buffer it: a buffered message could still be
      // sent much later, after we've already shown it as failed.
      if (!socket.connected) return fail()

      socket.timeout(ACK_TIMEOUT_MS).emit("message:send", { conversationId, content, clientId }, (err, res) => {
        if (err) return fail() // no ack in time
        if (!res.ok) return fail(res.error)
        dispatch({ type: "message/received", message: res.message, myId, isViewing: true })
      })
    },
    [myId]
  )

  // Optimistic UI: show the message immediately, then reconcile with the ack
  const sendMessage = useCallback(
    (conversationId, content) => {
      const clientId = createClientId()
      const message = {
        id: clientId,
        clientId,
        conversation: conversationId,
        sender: { id: myId, username: user.username, avatar: user.avatar },
        type: "text",
        content,
        createdAt: new Date().toISOString(),
        status: "pending",
      }
      dispatch({ type: "message/optimistic", message })
      emitMessage(message)
    },
    [myId, user.username, user.avatar, emitMessage]
  )

  const retryMessage = useCallback(
    (conversationId, clientId) => {
      const message = stateRef.current.messages[conversationId]?.items.find((m) => m.clientId === clientId)
      if (!message) return
      dispatch({ type: "message/retrying", conversationId, clientId })
      emitMessage(message)
    },
    [emitMessage]
  )

  const sendAttachment = useCallback(
    async (conversationId, { file, content }, onProgress) => {
      const message = await messagesApi.sendAttachment(
        conversationId,
        { file, content, clientId: createClientId() },
        onProgress
      )
      dispatch({ type: "message/received", message, myId, isViewing: true })
    },
    [myId]
  )

  const editMessage = useCallback(async (messageId, content) => {
    dispatch({ type: "message/updated", message: await messagesApi.edit(messageId, content) })
  }, [])

  const deleteMessage = useCallback(async (messageId) => {
    dispatch({ type: "message/updated", message: await messagesApi.remove(messageId) })
  }, [])

  // ── Conversations ────────────────────────────────────────────────────

  const upsertConversation = useCallback((conversation) => {
    if (conversation) dispatch({ type: "conversation/upserted", conversation })
    return conversation
  }, [])

  const setActiveConversation = useCallback((conversationId) => {
    dispatch({ type: "conversation/activated", conversationId })
  }, [])

  const startDirectChat = useCallback(
    async (userId) => upsertConversation(await conversationsApi.createDirect(userId)),
    [upsertConversation]
  )

  const createGroup = useCallback(
    async (name, memberIds) => upsertConversation(await conversationsApi.createGroup(name, memberIds)),
    [upsertConversation]
  )

  const leaveGroup = useCallback(
    async (conversationId) => {
      leavingIds.current.add(conversationId)
      try {
        await conversationsApi.removeMember(conversationId, myId)
        dispatch({ type: "conversation/removed", conversationId })
        navigate("/chat")
      } finally {
        leavingIds.current.delete(conversationId)
      }
    },
    [myId, navigate]
  )

  // ── Server → client events ───────────────────────────────────────────

  useSocketEvent("connect", () => {
    // The first connect is covered by the initial REST load
    if (hasConnectedBefore.current) backfill()
    hasConnectedBefore.current = true
  })

  useSocketEvent("message:new", (message) => {
    const { activeId, conversations } = stateRef.current
    const conversation = conversations[message.conversation]
    const isViewing = activeId === message.conversation && document.visibilityState === "visible"

    dispatch({ type: "message/received", message, myId, isViewing })

    // e.g. the first message of a DM someone else just started with us
    if (!conversation) {
      conversationsApi.get(message.conversation).then(upsertConversation).catch(() => {})
    }

    if (!isViewing && message.type !== "system" && message.sender?.id !== myId) {
      const title = conversation ? getConversationTitle(conversation, myId) : message.sender.username
      toast.custom(
        (t) => (
          <MessageToast
            toast={t}
            sender={message.sender}
            title={conversation?.type === "group" ? `${message.sender.username} · ${title}` : title}
            preview={getMessagePreview(message, myId)}
            onOpen={() => navigate(`/chat/${message.conversation}`)}
          />
        ),
        { id: `msg-${message.conversation}`, duration: 4000 }
      )
    }
  })

  useSocketEvent("message:updated", (message) => dispatch({ type: "message/updated", message }))
  useSocketEvent("message:deleted", (message) => dispatch({ type: "message/updated", message }))

  useSocketEvent("conversation:new", upsertConversation)
  useSocketEvent("conversation:updated", upsertConversation)

  useSocketEvent("conversation:removed", ({ conversationId }) => {
    const conversation = stateRef.current.conversations[conversationId]
    dispatch({ type: "conversation/removed", conversationId })

    if (conversation && !leavingIds.current.has(conversationId)) {
      toast(`You were removed from "${conversation.name}"`)
      if (stateRef.current.activeId === conversationId) navigate("/chat")
    }
  })

  useSocketEvent("conversation:read", (payload) => dispatch({ type: "conversation/read", ...payload, myId }))

  const handleTyping = (isTyping, payload) => {
    if (payload.userId === myId) return // our own other tabs
    const key = `${payload.conversationId}:${payload.userId}`
    clearTimeout(typingTimers.current.get(key))

    dispatch({ type: isTyping ? "typing/started" : "typing/stopped", ...payload })
    // If the "stop" event is lost (e.g. their connection drops), expire it anyway
    if (isTyping) {
      typingTimers.current.set(
        key,
        setTimeout(() => dispatch({ type: "typing/stopped", ...payload }), TYPING_EXPIRY_MS)
      )
    }
  }
  useSocketEvent("typing:start", (payload) => handleTyping(true, payload))
  useSocketEvent("typing:stop", (payload) => handleTyping(false, payload))

  useEffect(() => {
    const timers = typingTimers.current
    return () => timers.forEach(clearTimeout)
  }, [])

  useSocketEvent("presence:snapshot", ({ onlineUserIds }) => dispatch({ type: "presence/snapshot", onlineUserIds }))
  useSocketEvent("presence:update", (payload) => dispatch({ type: "presence/updated", ...payload }))

  // ── Read receipts ────────────────────────────────────────────────────

  const active = state.activeId ? state.conversations[state.activeId] : null
  const activeId = active?.id
  const lastMessageAt = active?.lastMessage?.createdAt
  const myLastReadAt = active?.participants.find((p) => p.user.id === myId)?.lastReadAt

  // Tell the server we've read the open conversation, but only while the
  // tab is actually visible and only if there's something new to read.
  useEffect(() => {
    if (!activeId || !isVisible || !lastMessageAt) return
    if (myLastReadAt && new Date(myLastReadAt) >= new Date(lastMessageAt)) return
    socket.emit("conversation:read", { conversationId: activeId })
  }, [activeId, isVisible, lastMessageAt, myLastReadAt])

  // ── Derived state ────────────────────────────────────────────────────

  const conversationList = useMemo(
    () => Object.values(state.conversations).sort((a, b) => getLastActivity(b) - getLastActivity(a)),
    [state.conversations]
  )

  const totalUnread = conversationList.reduce((sum, c) => sum + c.unreadCount, 0)
  useEffect(() => {
    document.title = totalUnread ? `(${totalUnread}) ${BASE_TITLE}` : BASE_TITLE
    return () => {
      document.title = BASE_TITLE
    }
  }, [totalUnread])

  const value = useMemo(
    () => ({
      ...state,
      myId,
      conversationList,
      activeConversation: active,
      setActiveConversation,
      loadMessages,
      sendMessage,
      retryMessage,
      sendAttachment,
      editMessage,
      deleteMessage,
      upsertConversation,
      startDirectChat,
      createGroup,
      leaveGroup,
    }),
    [
      state,
      myId,
      conversationList,
      active,
      setActiveConversation,
      loadMessages,
      sendMessage,
      retryMessage,
      sendAttachment,
      editMessage,
      deleteMessage,
      upsertConversation,
      startDirectChat,
      createGroup,
      leaveGroup,
    ]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
