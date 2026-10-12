import { useState } from "react"
import { Link } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { getErrorMessage, getFieldErrors } from "../services/api"
import { validateEmail, validatePassword, validateUsername } from "../utils/validation"
import AuthLayout from "../components/layout/AuthLayout"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"

const validators = {
  username: validateUsername,
  email: validateEmail,
  password: validatePassword,
}

function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  // Validate a field when the user leaves it, not on every keystroke
  const validateField = (field) => () => {
    if (form[field]) setErrors((errs) => ({ ...errs, [field]: validators[field](form[field]) ?? undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = Object.fromEntries(
      Object.entries(validators).map(([field, validate]) => [field, validate(form[field]) ?? undefined])
    )
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setIsSubmitting(true)
    setFormError("")
    try {
      await register(form.username.trim(), form.email.trim(), form.password)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      setErrors(fieldErrors)
      // A field-specific error (e.g. "username taken") is shown on the field itself
      if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(err, "Registration failed"))
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start chatting in seconds"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
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
          label="Username"
          value={form.username}
          onChange={update("username")}
          onBlur={validateField("username")}
          error={errors.username}
          hint="3–20 characters: letters, numbers, underscores"
          autoComplete="username"
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={update("email")}
          onBlur={validateField("email")}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          onBlur={validateField("password")}
          error={errors.password}
          hint="At least 8 characters, with a letter and a number"
          autoComplete="new-password"
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
