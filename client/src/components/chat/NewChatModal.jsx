import { useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import clsx from "clsx"
import { X } from "lucide-react"
import useChat from "../../hooks/useChat"
import { getErrorMessage } from "../../services/api"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import Input from "../ui/Input"
import UserSearch from "./UserSearch"

const TABS = [
  { id: "direct", label: "Direct message" },
  { id: "group", label: "New group" },
]

function NewChatModal({ onClose }) {
  const { startDirectChat, createGroup } = useChat()
  const navigate = useNavigate()
  const [tab, setTab] = useState("direct")
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = (conversation) => {
    onClose()
    navigate(`/chat/${conversation.id}`)
  }

  const handleDirect = async (user) => {
    setIsSubmitting(true)
    try {
      open(await startDirectChat(user.id))
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't start the conversation"))
      setIsSubmitting(false)
    }
  }

  const toggleMember = (user) =>
    setMembers((prev) => (prev.some((m) => m.id === user.id) ? prev.filter((m) => m.id !== user.id) : [...prev, user]))

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      open(await createGroup(groupName.trim(), members.map((m) => m.id)))
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't create the group"))
      setIsSubmitting(false)
    }
  }

  const canCreateGroup = groupName.trim() && members.length > 0

  return (
    <Modal
      title="New conversation"
      onClose={onClose}
      footer={
        tab === "group" && (
          <Button type="submit" form="new-group-form" disabled={!canCreateGroup} loading={isSubmitting}>
            Create group
          </Button>
        )
      }
    >
      <div role="tablist" className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "rounded-md py-1.5 text-sm font-medium transition",
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "direct" ? (
        <fieldset disabled={isSubmitting}>
          <UserSearch onSelect={handleDirect} autoFocus />
        </fieldset>
      ) : (
        <form id="new-group-form" onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={50}
            placeholder="e.g. Weekend plans"
            autoFocus
          />

          {members.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Selected members">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggleMember(m)}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pl-3 pr-2 text-sm text-indigo-700 hover:bg-indigo-100"
                    aria-label={`Remove ${m.username}`}
                  >
                    {m.username}
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <UserSearch onSelect={toggleMember} selectedIds={members.map((m) => m.id)} />
        </form>
      )}
    </Modal>
  )
}

export default NewChatModal
