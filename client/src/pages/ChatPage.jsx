import { useParams } from "react-router-dom"
import clsx from "clsx"
import { MessagesSquare } from "lucide-react"
import Sidebar from "../components/chat/Sidebar"
import ChatWindow from "../components/chat/ChatWindow"

// The open conversation lives in the URL (/chat/:conversationId), so it
// survives refreshes, can be linked to, and the back button works on mobile.
function ChatPage() {
  const { conversationId } = useParams()

  return (
    <div className="flex h-full">
      {/* On small screens show either the list or the conversation */}
      <aside
        className={clsx(
          "h-full w-full flex-col border-r border-slate-200 bg-white md:flex md:w-80 lg:w-96",
          conversationId ? "hidden" : "flex"
        )}
      >
        <Sidebar />
      </aside>

      <main className={clsx("h-full min-w-0 flex-1", conversationId ? "flex" : "hidden md:flex")}>
        {conversationId ? (
          // key: switching conversations starts from a fresh component state
          <ChatWindow key={conversationId} conversationId={conversationId} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <MessagesSquare className="size-14 text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-700">Your messages</h2>
            <p className="max-w-xs text-sm text-slate-500">Pick a conversation on the left, or start a new one.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default ChatPage
