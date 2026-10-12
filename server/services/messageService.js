import mongoose from "mongoose"
import Message from "../models/Message.js"
import Conversation from "../models/Conversation.js"
import ApiError from "../utils/ApiError.js"
import { getIO, rooms } from "../sockets/io.js"
import { assertIsMember } from "./membership.js"
import * as uploadService from "./uploadService.js"

const SENDER_FIELDS = "username avatar"

const broadcast = (event, message) => {
  getIO().to(rooms.conversation(message.conversation)).emit(event, message)
}

// Saves a message, makes it the conversation's latest, and returns a plain
// object ready to send over HTTP or Socket.IO.
const persist = async ({ conversationId, senderId, type, content = "", attachment, clientId }) => {
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    type,
    content,
    attachment,
    clientId,
  })

  const update = { $set: { lastMessage: message._id } }
  const options = {}
  if (senderId) {
    // Sending a message implies you've read everything before it
    update.$set["participants.$[me].lastReadAt"] = message.createdAt
    options.arrayFilters = [{ "me.user": new mongoose.Types.ObjectId(String(senderId)) }]
  }
  // Also bumps updatedAt, which orders the sidebar
  await Conversation.updateOne({ _id: conversationId }, update, options)

  await message.populate("sender", SENDER_FIELDS)
  return message.toJSON()
}

export const sendText = async ({ senderId, conversationId, content, clientId }) => {
  await assertIsMember(conversationId, senderId)

  let message
  try {
    message = await persist({ conversationId, senderId, type: "text", content, clientId })
  } catch (err) {
    // A retry of a message we already saved: return the original instead
    if (err.code !== 11000 || !clientId) throw err
    const existing = await Message.findOne({ sender: senderId, clientId }).populate("sender", SENDER_FIELDS)
    return existing.toJSON()
  }

  broadcast("message:new", message)
  return message
}

export const sendAttachment = async ({ senderId, conversationId, file, content, clientId }) => {
  // Check membership before uploading so outsiders can't use our storage
  await assertIsMember(conversationId, senderId)

  const result = await uploadService.uploadAttachment(file, conversationId)
  const attachment = {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  }

  let message
  try {
    message = await persist({
      conversationId,
      senderId,
      type: file.mimetype.startsWith("image/") ? "image" : "file",
      content,
      attachment,
      clientId,
    })
  } catch (err) {
    // Don't leave an orphaned file behind if the database write fails
    await uploadService.destroy(attachment.publicId, attachment.resourceType)
    throw err
  }

  broadcast("message:new", message)
  return message
}

export const sendSystem = async (conversationId, content) => {
  const message = await persist({ conversationId, type: "system", content })
  broadcast("message:new", message)
  return message
}

// Cursor pagination: `before` pages backwards through history (scrolling up),
// `after` fetches anything newer (catching up after a reconnect). Unlike
// skip/limit, a cursor stays correct while new messages keep arriving.
export const list = async ({ userId, conversationId, before, after, limit }) => {
  await assertIsMember(conversationId, userId)

  const filter = { conversation: conversationId }
  if (before) filter._id = { $lt: before }
  if (after) filter._id = { $gt: after }

  const docs = await Message.find(filter)
    .sort({ _id: after ? 1 : -1 })
    .limit(limit + 1) // fetch one extra to know whether another page exists
    .populate("sender", SENDER_FIELDS)

  const hasMore = docs.length > limit
  const page = docs.slice(0, limit)
  if (!after) page.reverse() // always return oldest → newest

  return { messages: page.map((m) => m.toJSON()), hasMore }
}

const findOwnMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId)
  if (!message || message.deletedAt) throw ApiError.notFound("Message not found")

  // Leaving a group also means losing access to your old messages in it
  await assertIsMember(message.conversation, userId)

  if (!message.sender?.equals(userId)) {
    throw ApiError.forbidden("You can only change your own messages")
  }
  return message
}

export const edit = async ({ userId, messageId, content }) => {
  const message = await findOwnMessage(messageId, userId)
  if (message.type !== "text") throw ApiError.badRequest("Only text messages can be edited")

  message.content = content
  message.editedAt = new Date()
  await message.save()
  await message.populate("sender", SENDER_FIELDS)

  const payload = message.toJSON()
  broadcast("message:updated", payload)
  return payload
}

export const remove = async ({ userId, messageId }) => {
  const message = await findOwnMessage(messageId, userId)

  message.deletedAt = new Date()
  await message.save()

  if (message.attachment) {
    await uploadService.destroy(message.attachment.publicId, message.attachment.resourceType)
  }

  await message.populate("sender", SENDER_FIELDS)
  const payload = message.toJSON()
  broadcast("message:deleted", payload)
  return payload
}
