import mongoose from "mongoose"

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    // Everything newer than this counts as unread for this participant
    lastReadAt: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    // Only groups have a name; a DM is shown as the other participant
    name: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    participants: [participantSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    // Sorted "<userIdA>_<userIdB>" for direct chats. The unique index makes
    // the database (not application code) guarantee that two users only ever
    // share one DM, even if both start a chat at the same instant.
    directKey: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      flattenObjectIds: true,
      transform: (_doc, ret) => {
        // Transforms can run more than once on populated docs, so keep them idempotent
        if (ret._id) ret.id = ret._id
        delete ret._id
        delete ret.__v
        delete ret.directKey
        return ret
      },
    },
  }
)

// Serves both "which conversations is this user in" and the sidebar ordering
conversationSchema.index({ "participants.user": 1, updatedAt: -1 })
conversationSchema.index(
  { directKey: 1 },
  { unique: true, partialFilterExpression: { directKey: { $type: "string" } } }
)

conversationSchema.statics.directKeyFor = (userIdA, userIdB) =>
  [userIdA.toString(), userIdB.toString()].sort().join("_")

conversationSchema.methods.getParticipant = function (userId) {
  return this.participants.find((p) => (p.user._id ?? p.user).equals(userId))
}

const Conversation = mongoose.model("Conversation", conversationSchema)

export default Conversation
