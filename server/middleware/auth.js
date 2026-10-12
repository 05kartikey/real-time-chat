import { authenticateToken } from "../services/authService.js"

const protect = async (req, _res, next) => {
  const header = req.headers.authorization ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null

  req.user = await authenticateToken(token)
  next()
}

export default protect
