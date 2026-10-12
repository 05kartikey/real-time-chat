import { Router } from "express"
import * as userController from "../controllers/userController.js"
import protect from "../middleware/auth.js"
import validate from "../middleware/validate.js"
import { avatarUpload } from "../middleware/upload.js"
import { searchUsersSchema, updateProfileSchema } from "../validators/userSchemas.js"

const router = Router()

router.use(protect)

router.get("/", validate({ query: searchUsersSchema }), userController.search)
router.patch("/me", validate({ body: updateProfileSchema }), userController.updateMe)
router.patch("/me/avatar", avatarUpload, userController.updateAvatar)

export default router
