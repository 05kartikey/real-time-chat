import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function LoginPage() {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(identifier, password)
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
    }
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  )
}

export default LoginPage
