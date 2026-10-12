import { useState } from "react"
import toast from "react-hot-toast"
import { Crown, UserMinus, UserPlus } from "lucide-react"
import useChat from "../../hooks/useChat"
import { conversationsApi } from "../../services/chatApi"
import { getErrorMessage } from "../../services/api"
import { getMyRole } from "../../utils/conversation"
import Modal from "../ui/Modal"
import Button, { IconButton } from "../ui/Button"
import Input from "../ui/Input"
import Avatar from "../ui/Avatar"
import UserSearch from "./UserSearch"

function GroupInfoModal({ conversation, onClose }) {
  const { myId, online, upsertConversation, leaveGroup } = useChat()
  const isAdmin = getMyRole(conversation, myId) === "admin"
  const [name, setName] = useState(conversation.name)
  const [isAdding, setIsAdding] = useState(false)
  const [busy, setBusy] = useState(null) // which action is in flight

  // Runs an API call, applies the updated conversation, reports errors
  const run = async (key, action, fallback) => {
    setBusy(key)
    try {
      upsertConversation(await action())
      return true
    } catch (err) {
      toast.error(getErrorMessage(err, fallback))
      return false
    } finally {
      setBusy(null)
    }
  }

  const handleRename = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === conversation.name) return
    run("rename", () => conversationsApi.rename(conversation.id, trimmed), "Couldn't rename the group")
  }

  const handleAdd = async (user) => {
    const ok = await run("add", () => conversationsApi.addMembers(conversation.id, [user.id]), "Couldn't add member")
    if (ok) toast.success(`${user.username} was added`)
  }

  const handleRemove = (member) => {
    if (!window.confirm(`Remove ${member.username} from the group?`)) return
    run(`remove-${member.id}`, () => conversationsApi.removeMember(conversation.id, member.id), "Couldn't remove member")
  }

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${conversation.name}"?`)) return
    setBusy("leave")
    try {
      await leaveGroup(conversation.id)
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't leave the group"))
      setBusy(null)
    }
  }

  // Admins first, then alphabetical
  const members = [...conversation.participants].sort(
    (a, b) =>
      (a.role === "admin" ? -1 : 0) - (b.role === "admin" ? -1 : 0) ||
      a.user.username.localeCompare(b.user.username)
  )

  return (
    <Modal
      title="Group info"
      onClose={onClose}
      footer={
        <Button variant="danger" onClick={handleLeave} loading={busy === "leave"}>
          Leave group
        </Button>
      }
    >
      <div className="space-y-6">
        {isAdmin ? (
          <form onSubmit={handleRename} className="flex items-end gap-2">
            <Input
              label="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="secondary"
              loading={busy === "rename"}
              disabled={!name.trim() || name.trim() === conversation.name}
            >
              Save
            </Button>
          </form>
        ) : (
          <h3 className="text-lg font-semibold">{conversation.name}</h3>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{conversation.participants.length} members</h3>
            {isAdmin && (
              <Button variant="ghost" className="px-2 py-1" onClick={() => setIsAdding((v) => !v)}>
                <UserPlus className="size-4" /> {isAdding ? "Done" : "Add"}
              </Button>
            )}
          </div>

          {isAdding && (
            <div className="mb-3 rounded-lg border border-slate-200 p-3">
              <UserSearch
                onSelect={handleAdd}
                excludeIds={conversation.participants.map((p) => p.user.id)}
                autoFocus
              />
            </div>
          )}

          <ul className="space-y-1">
            {members.map(({ user, role }) => (
              <li key={user.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                <Avatar name={user.username} src={user.avatar} size="sm" online={user.id !== myId && online[user.id]} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                  {user.username}
                  {user.id === myId && <span className="font-normal text-slate-400"> (you)</span>}
                </p>
                {role === "admin" && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                    <Crown className="size-3.5" /> Admin
                  </span>
                )}
                {isAdmin && user.id !== myId && (
                  <IconButton
                    label={`Remove ${user.username}`}
                    onClick={() => handleRemove(user)}
                    disabled={busy === `remove-${user.id}`}
                  >
                    <UserMinus className="size-4" />
                  </IconButton>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  )
}

export default GroupInfoModal
