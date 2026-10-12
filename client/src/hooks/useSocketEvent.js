import { useEffect, useRef } from "react"
import socket from "../socket"

// Subscribes to a socket event for the lifetime of the component. The latest
// handler is kept in a ref, so the listener is attached once rather than
// re-attached on every render (which could drop events in between).
export default function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const listener = (...args) => handlerRef.current(...args)
    socket.on(event, listener)
    return () => socket.off(event, listener)
  }, [event])
}
