import { z } from "zod"
import { objectId } from "../utils/objectId.js"

const groupName = z.string().trim().min(1, "Group name is required").max(50, "Group name is too long")

export const conversationParams = z.object({ id: objectId })

export const memberParams = z.object({ id: objectId, userId: objectId })

export const createDirectSchema = z.object({ userId: objectId })

export const createGroupSchema = z.object({
  name: groupName,
  memberIds: z.array(objectId).min(1, "Add at least one member").max(49),
})

export const renameSchema = z.object({ name: groupName })

export const addMembersSchema = z.object({
  userIds: z.array(objectId).min(1, "Select at least one user").max(49),
})

export const listMessagesQuery = z
  .object({
    before: objectId.optional(),
    after: objectId.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(30),
  })
  .refine((q) => !(q.before && q.after), { message: "Use either before or after, not both", path: ["after"] })
