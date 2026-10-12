import mongoose from "mongoose"
import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"
import User from "../models/User.js"
import ApiError from "../utils/ApiError.js"
import { getIO, rooms } from "../sockets/io.js"
import { assertMember, assertGroupAdmin } from "./membership.js"
import { PUBLIC_FIELDS } from "./userService.js"
import * as messageService from "./messageService.js"

export const MAX_GROUP_SIZE = 50

const POPULATE = [
  { path: "participants.user", select: PUBLIC_FIELDS },
  { path: "lastMessage", populate: { path: "sender", select: "username" } },
]

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id))

// Unread = messages from other people newer than my lastReadAt. One
// aggregation covers every conversation instead of one count query each.
const countUnread = async (conversations, userId) => {
  if (conversations.length === 0) return new Map()

  const perConversation = conversations.map((c) => ({
    conversation: c._id,
    createdAt: { $gt: c.getParticipant(userId).lastReadAt },
  }))

  const rows = await Message.aggregate([
    {
      $match: {
        $or: perConversation,
        sender: { $ne: toObjectId(userId) },
        type: { $ne: "system" },
        deletedAt: null,
      },
    },
    { $group: { _id: "$conversation", count: { $sum: 1 } } },
  ])

  return new Map(rows.map((row) => [row._id.toString(), row.count]))
}

const serialize = async (conversation, userId) => {
  await conversation.populate(POPULATE)
  const unread = await countUnread([conversation], userId)
  return { ...conversation.toJSON(), unreadCount: unread.get(conversation.id) ?? 0 }
}

// Socket.IO rooms are per-server, but with the Redis adapter these calls
// reach the user's sockets on every instance.
const joinRoom = (userIds, conversationId) => {
  getIO().in(userIds.map((id) => rooms.user(id))).socketsJoin(rooms.conversation(conversationId))
}

const leaveRoom = (userId, conversationId) => {
  getIO().in(rooms.user(userId)).socketsLeave(rooms.conversation(conversationId))
}

const emitToUsers = (userIds, event, payload) => {
  getIO().to(userIds.map((id) => rooms.user(id))).emit(event, payload)
}

// Participant changes, renames, etc. Unread counts are per user, so they're stripped.
const emitUpdated = (conversation) => {
  // eslint-disable-next-line no-unused-vars
  const { unreadCount, ...shared } = conversation
  getIO().to(rooms.conversation(conversation.id)).emit("conversation:updated", shared)
}

export const listForUser = async (userId) => {
  const conversations = await Conversation.find({
    "participants.user": userId,
    // Hide a DM someone opened with me until they actually send something
    $or: [{ type: "group" }, { lastMessage: { $exists: true } }, { createdBy: userId }],
  })
    .sort({ updatedAt: -1 })
    .populate(POPULATE)

  const unread = await countUnread(conversations, userId)
  return conversations.map((c) => ({ ...c.toJSON(), unreadCount: unread.get(c.id) ?? 0 }))
}

export const getById = async (userId, conversationId) => {
  const conversation = await assertMember(conversationId, userId)
  return serialize(conversation, userId)
}

export const findOrCreateDirect = async (userId, otherUserId) => {
  if (String(userId) === otherUserId) {
    throw ApiError.badRequest("You can't start a conversation with yourself")
  }
  if (!(await User.exists({ _id: otherUserId }))) {
    throw ApiError.notFound("User not found")
  }

  const directKey = Conversation.directKeyFor(userId, otherUserId)
  let conversation = await Conversation.findOne({ directKey })
  let created = false

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        type: "direct",
        directKey,
        createdBy: userId,
        participants: [{ user: userId }, { user: otherUserId }],
      })
      created = true
    } catch (err) {
      // Lost a race with the other user creating the same DM: use theirs
      if (err.code !== 11000) throw err
      conversation = await Conversation.findOne({ directKey })
    }
  }

  if (created) joinRoom([userId, otherUserId], conversation.id)

  return { conversation: await serialize(conversation, userId), created }
}

export const createGroup = async (creator, { name, memberIds }) => {
  const others = [...new Set(memberIds)].filter((id) => id !== creator.id)

  if (others.length === 0) throw ApiError.badRequest("Add at least one other member")
  if (others.length + 1 > MAX_GROUP_SIZE) {
    throw ApiError.badRequest(`Groups are limited to ${MAX_GROUP_SIZE} members`)
  }
  if ((await User.countDocuments({ _id: { $in: others } })) !== others.length) {
    throw ApiError.notFound("One or more users were not found")
  }

  const conversation = await Conversation.create({
    type: "group",
    name,
    createdBy: creator.id,
    participants: [{ user: creator.id, role: "admin" }, ...others.map((id) => ({ user: id }))],
  })

  const memberIdsWithCreator = [creator.id, ...others]
  joinRoom(memberIdsWithCreator, conversation.id)
  await messageService.sendSystem(conversation._id, `${creator.username} created the group "${name}"`)

  const payload = await serialize(conversation, creator.id)
  emitToUsers(memberIdsWithCreator, "conversation:new", payload)
  return payload
}

export const rename = async (actor, conversationId, name) => {
  const conversation = await assertGroupAdmin(conversationId, actor.id)

  conversation.name = name
  await conversation.save()
  await messageService.sendSystem(conversation._id, `${actor.username} renamed the group to "${name}"`)

  const payload = await serialize(conversation, actor.id)
  emitUpdated(payload)
  return payload
}

export const addMembers = async (actor, conversationId, userIds) => {
  const conversation = await assertGroupAdmin(conversationId, actor.id)

  const existing = new Set(conversation.participants.map((p) => p.user.toString()))
  const newIds = [...new Set(userIds)].filter((id) => !existing.has(id))

  if (newIds.length === 0) throw ApiError.badRequest("Those users are already in the group")
  if (existing.size + newIds.length > MAX_GROUP_SIZE) {
    throw ApiError.badRequest(`Groups are limited to ${MAX_GROUP_SIZE} members`)
  }

  const users = await User.find({ _id: { $in: newIds } }).select("username")
  if (users.length !== newIds.length) throw ApiError.notFound("One or more users were not found")

  conversation.participants.push(...newIds.map((id) => ({ user: id })))
  await conversation.save()

  joinRoom(newIds, conversation.id)
  await messageService.sendSystem(
    conversation._id,
    `${actor.username} added ${users.map((u) => u.username).join(", ")}`
  )

  const payload = await serialize(conversation, actor.id)
  emitToUsers(newIds, "conversation:new", { ...payload, unreadCount: 0 })
  emitUpdated(payload)
  return payload
}

// Handles both an admin removing someone and a member leaving on their own.
export const removeMember = async (actor, conversationId, targetId) => {
  const conversation = await assertMember(conversationId, actor.id)
  const isLeaving = targetId === actor.id

  if (conversation.type !== "group") {
    throw ApiError.badRequest("You can't leave a direct conversation")
  }
  if (!isLeaving && conversation.getParticipant(actor.id).role !== "admin") {
    throw ApiError.forbidden("Only group admins can remove members")
  }
  if (!conversation.getParticipant(targetId)) {
    throw ApiError.notFound("That user is not in this group")
  }

  const target = isLeaving ? actor : await User.findById(targetId).select("username")
  conversation.participants = conversation.participants.filter((p) => !p.user.equals(targetId))

  // Stop delivering this group's events to the removed user immediately
  leaveRoom(targetId, conversation.id)
  emitToUsers([targetId], "conversation:removed", { conversationId: conversation.id })

  if (conversation.participants.length === 0) {
    await Message.deleteMany({ conversation: conversation._id })
    await conversation.deleteOne()
    return null
  }

  // A group must always keep an admin: promote the longest-standing member
  if (!conversation.participants.some((p) => p.role === "admin")) {
    const [oldest] = [...conversation.participants].sort((a, b) => a.joinedAt - b.joinedAt)
    oldest.role = "admin"
  }

  await conversation.save()
  await messageService.sendSystem(
    conversation._id,
    isLeaving ? `${actor.username} left the group` : `${actor.username} removed ${target.username}`
  )

  const payload = await serialize(conversation, actor.id)
  emitUpdated(payload)
  return isLeaving ? null : payload
}

// Read receipts: everything up to now is read. timestamps: false so reading
// a chat doesn't reorder everyone's sidebar.
export const markRead = async (userId, conversationId) => {
  const readAt = new Date()

  const result = await Conversation.updateOne(
    { _id: conversationId, "participants.user": userId },
    { $set: { "participants.$.lastReadAt": readAt } },
    { timestamps: false }
  )
  if (result.matchedCount === 0) throw ApiError.notFound("Conversation not found")

  getIO().to(rooms.conversation(conversationId)).emit("conversation:read", { conversationId, userId, readAt })
  return { readAt }
}
