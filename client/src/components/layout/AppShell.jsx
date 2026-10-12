import { Outlet } from "react-router-dom"
import { WifiOff } from "lucide-react"
import { SocketProvider } from "../../context/SocketProvider"
import { ChatProvider } from "../../context/ChatProvider"
import useSocket from "../../hooks/useSocket"
import useAuth from "../../hooks/useAuth"

function ConnectionBanner() {
  const { isConnected, hasConnected } = useSocket()
  // Only after we've been connected once, so the initial handshake doesn't flash it
  if (isConnected || !hasConnected) return null

  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-1.5 text-sm text-amber-900">
      <WifiOff className="size-4" />
      Reconnecting… new messages will sync when you're back online.
    </div>
  )
}

// Everything behind login shares one socket connection and one chat store,
// so moving between the chat and profile pages keeps both alive.
function AppShell() {
  const { user } = useAuth()

  // key: if the signed-in user changes (e.g. a login in another tab), remount
  // everything so the socket reconnects with the new token and no chat state
  // from the previous user survives.
  return (
    <SocketProvider key={user.id}>
      <ChatProvider>
        <div className="flex h-full flex-col">
          <ConnectionBanner />
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </div>
      </ChatProvider>
    </SocketProvider>
  )
}

export default AppShell
