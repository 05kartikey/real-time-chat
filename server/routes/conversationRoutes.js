import { Router } from "express"
import * as conversationController from "../controllers/conversationController.js"
import protect from "../middleware/auth.js"
import validate from "../middleware/validate.js"
import { attachmentUpload } from "../middleware/upload.js"
import {
  conversationParams,
  memberParams,
  createDirectSchema,
  createGroupSchema,
  renameSchema,
  addMembersSchema,
  listMessagesQuery,
} from "../validators/conversationSchemas.js"
import { attachmentBodySchema } from "../validators/messageSchemas.js"

const router = Router()

router.use(protect)

router.get("/", conversationController.list)
router.post("/direct", validate({ body: createDirectSchema }), conversationController.createDirect)
router.post("/group", validate({ body: createGroupSchema }), conversationController.createGroup)

router.get("/:id", validate({ params: conversationParams }), conversationController.getById)
router.patch("/:id", validate({ params: conversationParams, body: renameSchema }), conversationController.rename)

router.post(
  "/:id/members",
  validate({ params: conversationParams, body: addMembersSchema }),
  conversationController.addMembers
)
router.delete("/:id/members/:userId", validate({ params: memberParams }), conversationController.removeMember)

router.get(
  "/:id/messages",
  validate({ params: conversationParams, query: listMessagesQuery }),
  conversationController.listMessages
)
// Text messages go over Socket.IO; files go over HTTP because multipart
// uploads with progress events are what HTTP is good at.
router.post(
  "/:id/messages/attachment",
  validate({ params: conversationParams }),
  attachmentUpload,
  validate({ body: attachmentBodySchema }),
  conversationController.sendAttachment
)

export default router
