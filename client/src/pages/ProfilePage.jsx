import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { ArrowLeft, Camera } from "lucide-react"
import useAuth from "../hooks/useAuth"
import { usersApi } from "../services/chatApi"
import { getErrorMessage, getFieldErrors } from "../services/api"
import { IMAGE_TYPES, MAX_AVATAR_SIZE, validateFile, validateUsername } from "../utils/validation"
import Avatar from "../components/ui/Avatar"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"
import Spinner from "../components/ui/Spinner"

function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const [form, setForm] = useState({ username: user.username, bio: user.bio ?? "" })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const isDirty = form.username.trim() !== user.username || form.bio.trim() !== (user.bio ?? "")

  const handleSubmit = async (e) => {
    e.preventDefault()
    const usernameError = validateUsername(form.username)
    if (usernameError) return setErrors({ username: usernameError })

    // Only send fields that actually changed
    const updates = {}
    if (form.username.trim() !== user.username) updates.username = form.username.trim()
    if (form.bio.trim() !== (user.bio ?? "")) updates.bio = form.bio.trim()

    setIsSaving(true)
    try {
      updateUser(await usersApi.updateMe(updates))
      setErrors({})
      toast.success("Profile updated")
    } catch (err) {
      setErrors(getFieldErrors(err))
      toast.error(getErrorMessage(err, "Couldn't update your profile"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const error = validateFile(file, { types: IMAGE_TYPES, maxSize: MAX_AVATAR_SIZE })
    if (error) return toast.error(error)

    setIsUploading(true)
    try {
      updateUser(await usersApi.updateAvatar(file))
      toast.success("Photo updated")
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't upload the photo"))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link to="/chat" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="size-4" /> Back to chats
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              <Avatar name={user.username} src={user.avatar} size="xl" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow ring-2 ring-white hover:bg-indigo-700"
              >
                {isUploading ? <Spinner className="size-4 text-white" /> : <Camera className="size-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">{user.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              error={errors.username}
            />
            <Input
              as="textarea"
              label="Bio"
              rows={3}
              maxLength={160}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              error={errors.bio}
              hint={`${form.bio.length}/160`}
              placeholder="A few words about yourself"
            />
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="secondary" onClick={logout}>
                Log out
              </Button>
              <Button type="submit" loading={isSaving} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
