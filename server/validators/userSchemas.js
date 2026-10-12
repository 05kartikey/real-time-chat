import { z } from "zod"
import { usernameSchema } from "./authSchemas.js"

export const searchUsersSchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(30),
})

export const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    bio: z.string().trim().max(160, "Bio must be at most 160 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Nothing to update")
