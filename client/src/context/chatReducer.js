// All chat state transitions in one pure function: easy to follow and to
// unit test, and REST responses and socket events update state the same way.

export const initialChatState = {
  conversations: {}, // id → conversation
  conversationsStatus: "loading", // "loading" | "ready" | "error"
  messages: {}, // conversationId → { items, hasMore, status }
  activeId: null,
  typing: {}, // conversationId → { userId: username }
  online: {}, // userId → true
  lastSeen: {}, // userId → ISO date, newer than what the conversation list says
}

const EMPTY_THREAD = { items: [], hasMore: true, status: "idle" }

const updateConversation = (state, id, update) => {
  const conversation = state.conversations[id]
  if (!conversation) return state
  return { ...state, conversations: { ...state.conversations, [id]: update(conversation) } }
}

const updateThread = (state, conversationId, update) => {
  const thread = state.messages[conversationId]
  if (!thread) return state
  return { ...state, messages: { ...state.messages, [conversationId]: update(thread) } }
}

// Adds or replaces messages by id, keeping chronological order
const mergeMessages = (items, incoming, position) => {
  const incomingIds = new Set(incoming.map((m) => m.id))
  const rest = items.filter((m) => !incomingIds.has(m.id))
  return position === "start" ? [...incoming, ...rest] : [...rest, ...incoming]
}

const replaceMessage = (items, message) => items.map((m) => (m.id === message.id ? message : m))

export function chatReducer(state, action) {
  switch (action.type) {
    case "conversations/loaded": {
      const conversations = Object.fromEntries(action.conversations.map((c) => [c.id, c]))
      return { ...state, conversations, conversationsStatus: "ready" }
    }

    case "conversations/failed":
      return { ...state, conversationsStatus: "error" }

    case "conversation/upserted": {
      const existing = state.conversations[action.conversation.id]
      const conversation = {
        ...existing,
        ...action.conversation,
        // "conversation:updated" events carry no per-user unread count
        unreadCount: action.conversation.unreadCount ?? existing?.unreadCount ?? 0,
      }
      return { ...state, conversations: { ...state.conversations, [conversation.id]: conversation } }
    }

    case "conversation/removed": {
      // eslint-disable-next-line no-unused-vars
      const { [action.conversationId]: _removed, ...conversations } = state.conversations
      // eslint-disable-next-line no-unused-vars
      const { [action.conversationId]: _thread, ...messages } = state.messages
      return {
        ...state,
        conversations,
        messages,
        activeId: state.activeId === action.conversationId ? null : state.activeId,
      }
    }

    case "conversation/activated":
      return { ...state, activeId: action.conversationId }

    case "conversation/read": {
      const { conversationId, userId, readAt, myId } = action
      return updateConversation(state, conversationId, (c) => ({
        ...c,
        participants: c.participants.map((p) => (p.user.id === userId ? { ...p, lastReadAt: readAt } : p)),
        unreadCount: userId === myId ? 0 : c.unreadCount,
      }))
    }

    case "messages/loading": {
      const thread = state.messages[action.conversationId] ?? EMPTY_THREAD
      return { ...state, messages: { ...state.messages, [action.conversationId]: { ...thread, status: "loading" } } }
    }

    case "messages/failed":
      return updateThread(state, action.conversationId, (t) => ({ ...t, status: "error" }))

    case "messages/loaded": {
      const { conversationId, messages, hasMore, mode } = action
      const thread = state.messages[conversationId] ?? EMPTY_THREAD

      let items
      if (mode === "older") items = mergeMessages(thread.items, messages, "start")
      else if (mode === "newer") items = mergeMessages(thread.items, messages, "end")
      // Fresh load: keep unsent local messages so a reload doesn't lose them
      else items = [...messages, ...thread.items.filter((m) => m.status)]

      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: {
            items,
            hasMore: mode === "newer" ? thread.hasMore : hasMore,
            status: "ready",
          },
        },
      }
    }

    case "message/optimistic":
      return updateThread(state, action.message.conversation, (t) => ({
        ...t,
        items: [...t.items, action.message],
      }))

    case "message/failed":
    case "message/retrying": {
      const status = action.type === "message/failed" ? "failed" : "pending"
      return updateThread(state, action.conversationId, (t) => ({
        ...t,
        items: t.items.map((m) => (m.clientId === action.clientId && m.status ? { ...m, status } : m)),
      }))
    }

    // A message confirmed by the server: our own ack, a socket broadcast, or
    // an upload response. The same message can arrive by more than one of
    // these routes, so this must be idempotent.
    case "message/received": {
      const { message, myId, isViewing } = action
      let next = updateThread(state, message.conversation, (t) => {
        const optimistic = message.clientId && t.items.find((m) => m.clientId === message.clientId && m.status)
        if (optimistic) return { ...t, items: t.items.map((m) => (m === optimistic ? message : m)) }
        if (t.items.some((m) => m.id === message.id)) return { ...t, items: replaceMessage(t.items, message) }
        return { ...t, items: [...t.items, message] }
      })

      next = updateConversation(next, message.conversation, (c) => {
        const isNew = c.lastMessage?.id !== message.id
        const countsAsUnread =
          isNew && !isViewing && message.type !== "system" && message.sender?.id !== myId
        return {
          ...c,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: c.unreadCount + (countsAsUnread ? 1 : 0),
        }
      })

      // Whoever just sent a message has stopped typing
      if (message.sender && next.typing[message.conversation]?.[message.sender.id]) {
        // eslint-disable-next-line no-unused-vars
        const { [message.sender.id]: _gone, ...typers } = next.typing[message.conversation]
        next = { ...next, typing: { ...next.typing, [message.conversation]: typers } }
      }
      return next
    }

    case "message/updated": {
      const { message } = action
      const next = updateThread(state, message.conversation, (t) => ({
        ...t,
        items: replaceMessage(t.items, message),
      }))
      return updateConversation(next, message.conversation, (c) =>
        c.lastMessage?.id === message.id ? { ...c, lastMessage: message } : c
      )
    }

    case "typing/started":
    case "typing/stopped": {
      const { conversationId, userId, username } = action
      // eslint-disable-next-line no-unused-vars
      const { [userId]: _prev, ...others } = state.typing[conversationId] ?? {}
      const typers = action.type === "typing/started" ? { ...others, [userId]: username } : others
      return { ...state, typing: { ...state.typing, [conversationId]: typers } }
    }

    case "presence/snapshot":
      return { ...state, online: Object.fromEntries(action.onlineUserIds.map((id) => [id, true])) }

    case "presence/updated": {
      const { userId, online, lastSeen } = action
      // eslint-disable-next-line no-unused-vars
      const { [userId]: _prev, ...rest } = state.online
      return {
        ...state,
        online: online ? { ...rest, [userId]: true } : rest,
        lastSeen: lastSeen ? { ...state.lastSeen, [userId]: lastSeen } : state.lastSeen,
      }
    }

    default:
      throw new Error(`Unknown chat action: ${action.type}`)
  }
}
