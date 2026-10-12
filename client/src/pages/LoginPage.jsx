import { useState } from "react"
import { Link } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { getErrorMessage, getFieldErrors } from "../services/api"
import AuthLayout from "../components/layout/AuthLayout"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"

function LoginPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({ identifier: "", password: "" })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {
      identifier: form.identifier.trim() ? undefined : "Enter your email or username",
      password: form.password ? undefined : "Enter your password",
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setIsSubmitting(true)
    setFormError("")
    try {
      // On success the user is set and PublicRoute redirects to /chat
      await login(form.identifier.trim(), form.password)
    } catch (err) {
      setErrors(getFieldErrors(err))
      setFormError(getErrorMessage(err, "Login failed"))
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue chatting"
      footer={
        <>
          No account?{" "}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {formError}
          </p>
        )}
        <Input
          label="Email or username"
          value={form.identifier}
          onChange={update("identifier")}
          error={errors.identifier}
          autoComplete="username"
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          autoComplete="current-password"
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
