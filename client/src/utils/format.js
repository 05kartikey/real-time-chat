import { format, formatDistanceToNowStrict, isToday, isYesterday, isSameYear } from "date-fns"

// Sidebar timestamps: "14:05", "Yesterday", "Mon 3 Jun", "03/06/24"
export const formatConversationTime = (date) => {
  const d = new Date(date)
  if (isToday(d)) return format(d, "HH:mm")
  if (isYesterday(d)) return "Yesterday"
  if (isSameYear(d, new Date())) return format(d, "d MMM")
  return format(d, "dd/MM/yy")
}

export const formatMessageTime = (date) => format(new Date(date), "HH:mm")

// Separators between days in the message list
export const formatDayLabel = (date) => {
  const d = new Date(date)
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  return format(d, isSameYear(d, new Date()) ? "EEEE, d MMMM" : "d MMMM yyyy")
}

export const formatLastSeen = (date) =>
  date ? `last seen ${formatDistanceToNowStrict(new Date(date), { addSuffix: true })}` : "offline"

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
