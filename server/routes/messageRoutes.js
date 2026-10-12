import { Router } from "express"
import * as messageController from "../controllers/messageController.js"
import protect from "../middleware/auth.js"
import validate from "../middleware/validate.js"
import { messageParams, editMessageSchema } from "../validators/messageSchemas.js"

const router = Router()

router.use(protect)

router.patch("/:id", validate({ params: messageParams, body: editMessageSchema }), messageController.edit)
router.delete("/:id", validate({ params: messageParams }), messageController.remove)

export default router
