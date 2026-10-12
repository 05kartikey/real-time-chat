import { memo } from "react"
import { NavLink } from "react-router-dom"
import clsx from "clsx"
import Avatar from "../ui/Avatar"
import { formatConversationTime } from "../../utils/format"
import { getConversationTitle, getMessagePreview, getOtherParticipant } from "../../utils/conversation"

// memo: with many conversations, only the ones whose props changed re-render
const ConversationItem = memo(function ConversationItem({ conversation, myId, isOnline, typingNames }) {
  const isGroup = conversation.type === "group"
  const other = isGroup ? null : getOtherParticipant(conversation, myId)
  const title = getConversationTitle(conversation, myId)
  const { lastMessage, unreadCount } = conversation

  const typingText = typingNames.length
    ? isGroup
      ? `${typingNames[0]} is typing…`
      : "typing…"
    : null

  return (
    <NavLink
      to={`/chat/${conversation.id}`}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
          isActive ? "bg-indigo-50" : "hover:bg-slate-50"
        )
      }
    >
      <Avatar name={title} src={other?.avatar} group={isGroup} online={isOnline} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-medium text-slate-900">{title}</p>
          {lastMessage && (
            <time
              className={clsx("shrink-0 text-xs", unreadCount ? "font-semibold text-indigo-600" : "text-slate-400")}
              dateTime={lastMessage.createdAt}
            >
              {formatConversationTime(lastMessage.createdAt)}
            </time>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={clsx("truncate text-sm", typingText ? "italic text-indigo-600" : "text-slate-500")}>
            {typingText ?? getMessagePreview(lastMessage, myId)}
          </p>
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread messages`}
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </NavLink>
  )
})

export default ConversationItem
