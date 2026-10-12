import { useCallback, useEffect, useRef } from "react"
import socket from "../socket"

const STOP_AFTER_MS = 2000

// Emits typing:start at most once per burst of typing (throttled), and
// typing:stop once the user pauses for 2s (debounced) or sends the message.
export default function useTyping(conversationId) {
  const isTypingRef = useRef(false)
  const stopTimerRef = useRef(null)

  const stopTyping = useCallback(() => {
    clearTimeout(stopTimerRef.current)
    if (isTypingRef.current) {
      isTypingRef.current = false
      socket.emit("typing:stop", { conversationId })
    }
  }, [conversationId])

  const notifyTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit("typing:start", { conversationId })
    }
    clearTimeout(stopTimerRef.current)
    stopTimerRef.current = setTimeout(stopTyping, STOP_AFTER_MS)
  }, [conversationId, stopTyping])

  // Switching conversations or unmounting ends the typing state
  useEffect(() => stopTyping, [stopTyping])

  return { notifyTyping, stopTyping }
}
