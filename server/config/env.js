import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { z } from "zod"

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, "../../.env"), quiet: true })

// Validate configuration once at boot so a missing variable fails loudly
// here instead of surfacing later as a confusing runtime error.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().min(1).default("http://localhost:5173"),
  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment configuration:")
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`)
  }
  process.exit(1)
}

const env = {
  ...parsed.data,
  // CLIENT_URL may be a comma-separated whitelist of allowed origins
  CLIENT_ORIGINS: parsed.data.CLIENT_URL.split(",").map((origin) => origin.trim()),
  isDev: parsed.data.NODE_ENV === "development",
}

export default env
