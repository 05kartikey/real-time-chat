// Development fallback used when REDIS_URL isn't set. It implements only the
// handful of Redis commands this app uses, with the same async API as
// node-redis, so the services don't need to know which one they're talking to.
// State lives in this process, so it only works with a single server instance.

const sets = new Map()
const counters = new Map()

const commands = {
  sAdd(key, members) {
    const set = sets.get(key) ?? new Set()
    sets.set(key, set)
    let added = 0
    for (const m of [].concat(members)) {
      if (!set.has(m)) {
        set.add(m)
        added++
      }
    }
    return added
  },
  sRem(key, members) {
    const set = sets.get(key)
    if (!set) return 0
    let removed = 0
    for (const m of [].concat(members)) if (set.delete(m)) removed++
    if (set.size === 0) sets.delete(key)
    return removed
  },
  sCard: (key) => sets.get(key)?.size ?? 0,
  sMembers: (key) => [...(sets.get(key) ?? [])],
  incr(key) {
    let counter = counters.get(key)
    if (!counter || (counter.expiresAt && counter.expiresAt <= Date.now())) {
      counter = { value: 0, expiresAt: null }
      counters.set(key, counter)
    }
    return ++counter.value
  },
  expire(key, seconds, mode) {
    const counter = counters.get(key)
    if (!counter || (mode === "NX" && counter.expiresAt)) return 0
    counter.expiresAt = Date.now() + seconds * 1000
    return 1
  },
}

export const createMemoryRedis = () => {
  const client = { isReady: true, isOpen: true }

  for (const [name, fn] of Object.entries(commands)) {
    client[name] = async (...args) => fn(...args)
  }

  // MULTI: queue commands, run them together on exec(). A single Node process
  // never interleaves synchronous code, so this is atomic like the real thing.
  client.multi = () => {
    const queue = []
    const transaction = { exec: async () => queue.map((run) => run()) }
    for (const [name, fn] of Object.entries(commands)) {
      transaction[name] = (...args) => {
        queue.push(() => fn(...args))
        return transaction
      }
    }
    return transaction
  }

  return client
}
