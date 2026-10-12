import { isSameDay } from "date-fns"

const GROUP_WINDOW_MS = 5 * 60 * 1000

// Annotates each message with how it should render: whether a day separator
// comes before it and whether it starts a new "bubble group" (a different
// sender, or a gap of more than five minutes).
export const annotateMessages = (messages) =>
  messages.map((message, i) => {
    const prev = messages[i - 1]
    const created = new Date(message.createdAt)
    const newDay = !prev || !isSameDay(new Date(prev.createdAt), created)

    const startsGroup =
      newDay ||
      prev.type === "system" ||
      message.type === "system" ||
      prev.sender?.id !== message.sender?.id ||
      created - new Date(prev.createdAt) > GROUP_WINDOW_MS

    return { message, newDay, startsGroup }
  })

export const createClientId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
