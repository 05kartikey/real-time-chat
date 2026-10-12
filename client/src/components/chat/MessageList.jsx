import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowDown } from "lucide-react"
import useChat from "../../hooks/useChat"
import MessageBubble from "./MessageBubble"
import Spinner from "../ui/Spinner"
import { annotateMessages } from "../../utils/messages"
import { formatDayLabel } from "../../utils/format"

const NEAR_BOTTOM_PX = 120

// Who has read a given message of mine: everyone else whose lastReadAt is at
// or after the message's timestamp.
const getSeenLabel = (conversation, message, myId) => {
  const sentAt = new Date(message.createdAt)
  const readers = conversation.participants.filter(
    (p) => p.user.id !== myId && p.lastReadAt && new Date(p.lastReadAt) >= sentAt
  )
  if (readers.length === 0) return null
  if (conversation.type === "direct") return "Seen"
  if (readers.length === conversation.participants.length - 1) return "Seen by everyone"
  return `Seen by ${readers.map((r) => r.user.username).join(", ")}`
}

function MessageList({ conversation, thread }) {
  const { myId, loadMessages, retryMessage, editMessage, deleteMessage } = useChat()
  const scrollRef = useRef(null)
  const topSentinelRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const previous = useRef({ firstId: null, lastId: null, scrollHeight: 0 })
  const [showJumpButton, setShowJumpButton] = useState(false)

  const items = thread.items
  const annotated = useMemo(() => annotateMessages(items), [items])

  // "Seen" goes under my most recent message that has been sent
  const lastMineId = useMemo(
    () => items.findLast((m) => m.sender?.id === myId && !m.status && !m.deletedAt)?.id,
    [items, myId]
  )

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  // Keep the viewport where the user expects it whenever the list changes:
  //  • older messages prepended → keep the same message in view (no jump)
  //  • new message appended     → follow it only if already at the bottom,
  //                                or if I sent it; otherwise offer a button
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const firstId = items[0]?.id
    const lastId = items.at(-1)?.id
    const prev = previous.current

    if (prev.lastId === null) {
      scrollToBottom()
    } else if (firstId !== prev.firstId && lastId === prev.lastId) {
      el.scrollTop += el.scrollHeight - prev.scrollHeight
    } else if (lastId !== prev.lastId) {
      const mine = items.at(-1)?.sender?.id === myId
      if (isNearBottomRef.current || mine) scrollToBottom("smooth")
      else setShowJumpButton(true)
    }

    previous.current = { firstId, lastId: lastId ?? null, scrollHeight: el.scrollHeight }
  }, [items, myId, scrollToBottom])

  const handleScroll = () => {
    const el = scrollRef.current
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
    if (isNearBottomRef.current) setShowJumpButton(false)
  }

  // Images change height when they finish loading
  const handleMediaLoad = useCallback(() => {
    if (isNearBottomRef.current) scrollToBottom()
  }, [scrollToBottom])

  // Infinite scroll upwards: load the previous page when the sentinel at the
  // top of the list scrolls into view. The observer is recreated after each
  // load, so if the sentinel is still visible (short pages) it keeps loading.
  const canLoadOlder = thread.hasMore && thread.status === "ready"
  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel || !canLoadOlder) return

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && loadMessages(conversation.id, { older: true }),
      { root: scrollRef.current, rootMargin: "200px 0px 0px 0px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [conversation.id, canLoadOlder, items.length, loadMessages])

  const handleRetry = useCallback((clientId) => retryMessage(conversation.id, clientId), [conversation.id, retryMessage])

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-thin h-full overflow-y-auto px-3 py-4 sm:px-6"
        role="log"
        aria-label="Messages"
      >
        <div ref={topSentinelRef} />
        {thread.status === "loading" && (
          <div className="flex justify-center py-3">
            <Spinner className="size-5" />
          </div>
        )}
        {!thread.hasMore && items.length > 0 && (
          <p className="py-3 text-center text-xs text-slate-400">This is the beginning of the conversation</p>
        )}
        {thread.status === "ready" && items.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-500">No messages yet. Say hello! 👋</p>
        )}

        <div className="space-y-1">
          {annotated.map(({ message, newDay, startsGroup }, i) => {
            const isMine = message.sender?.id === myId
            const next = annotated[i + 1]
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <div className="sticky top-0 z-10 flex justify-center py-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                      {formatDayLabel(message.createdAt)}
                    </span>
                  </div>
                )}
                <div className={startsGroup ? "pt-2" : undefined}>
                  <MessageBubble
                    message={message}
                    isMine={isMine}
                    showSender={conversation.type === "group" && startsGroup}
                    // Avatar on the last bubble of each group, like most chat apps
                    showAvatar={!next || next.startsGroup}
                    seenLabel={message.id === lastMineId ? getSeenLabel(conversation, message, myId) : null}
                    onRetry={handleRetry}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                    onMediaLoad={handleMediaLoad}
                  />
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>

      {showJumpButton && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-indigo-700"
        >
          <ArrowDown className="size-4" /> New messages
        </button>
      )}
    </div>
  )
}

export default MessageList
