import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: [/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers and underscores"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    // Never returned by queries unless explicitly requested with .select("+password")
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    bio: {
      type: String,
      default: "",
      maxlength: 160,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      flattenObjectIds: true,
      transform: (_doc, ret) => {
        // Transforms can run more than once on populated docs, so keep them idempotent
        if (ret._id) ret.id = ret._id
        if (typeof ret.avatar === "object") ret.avatar = ret.avatar?.url ?? ""
        delete ret._id
        delete ret.__v
        delete ret.password
        return ret
      },
    },
  }
)

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS)
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

const User = mongoose.model("User", userSchema)

export default User
