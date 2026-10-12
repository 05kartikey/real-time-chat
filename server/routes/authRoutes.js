import { Router } from "express"
import * as authController from "../controllers/authController.js"
import protect from "../middleware/auth.js"
import validate from "../middleware/validate.js"
import { authLimiter } from "../middleware/rateLimiter.js"
import { registerSchema, loginSchema } from "../validators/authSchemas.js"

const router = Router()

router.post("/register", authLimiter, validate({ body: registerSchema }), authController.register)
router.post("/login", authLimiter, validate({ body: loginSchema }), authController.login)
router.get("/me", protect, authController.me)

export default router
