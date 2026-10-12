import { useSyncExternalStore } from "react"

const subscribe = (callback) => {
  document.addEventListener("visibilitychange", callback)
  return () => document.removeEventListener("visibilitychange", callback)
}

// true while this tab is in the foreground
export default function usePageVisibility() {
  return useSyncExternalStore(subscribe, () => document.visibilityState === "visible")
}
