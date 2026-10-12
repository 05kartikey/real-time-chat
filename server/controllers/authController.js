import * as authService from "../services/authService.js"

// Controllers only translate between HTTP and the service layer. Express 5
// forwards rejected promises to the error handler, so no try/catch is needed.

export const register = async (req, res) => {
  const { user, token } = await authService.register(req.body)
  res.status(201).json({ user, token })
}

export const login = async (req, res) => {
  const { user, token } = await authService.login(req.body)
  res.json({ user, token })
}

export const me = (req, res) => {
  res.json({ user: req.user })
}
