import { redis } from "../config/redis.js"

// Presence is tracked per socket, not per user: each user has a Redis set of
// their live socket ids. A user is online while that set is non-empty, so a
// second tab connecting or one of several tabs closing doesn't flip their
// status. Redis (not process memory) makes this correct across server instances.
const key = (userId) => `presence:${userId}`

// MULTI makes add-then-count atomic: if two tabs connect at the same moment,
// exactly one of them sees the count go to 1.
export const addConnection = async (userId, socketId) => {
  const [, count] = await redis.multi().sAdd(key(userId), socketId).sCard(key(userId)).exec()
  return count === 1 // true → the user just came online
}

export const removeConnection = async (userId, socketId) => {
  const [, count] = await redis.multi().sRem(key(userId), socketId).sCard(key(userId)).exec()
  return count === 0 // true → the user just went offline
}

export const getConnections = (userId) => redis.sMembers(key(userId))

export const removeConnections = (userId, socketIds) => redis.sRem(key(userId), socketIds)

export const isOnline = async (userId) => (await redis.sCard(key(userId))) > 0

export const filterOnline = async (userIds) => {
  if (userIds.length === 0) return []

  const multi = redis.multi()
  for (const id of userIds) multi.sCard(key(id))
  const counts = await multi.exec()

  return userIds.filter((_id, i) => counts[i] > 0)
}
