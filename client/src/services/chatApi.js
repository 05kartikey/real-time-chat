import api from "./api"

// One function per endpoint keeps URLs and payload shapes out of components.

export const authApi = {
  login: (identifier, password) => api.post("/auth/login", { identifier, password }).then((r) => r.data),
  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data.user),
}

export const usersApi = {
  search: (q, { signal } = {}) => api.get("/users", { params: { q }, signal }).then((r) => r.data.users),
  updateMe: (updates) => api.patch("/users/me", updates).then((r) => r.data.user),
  updateAvatar: (file) => {
    const form = new FormData()
    form.append("avatar", file)
    return api.patch("/users/me/avatar", form).then((r) => r.data.user)
  },
}

export const conversationsApi = {
  list: () => api.get("/conversations").then((r) => r.data.conversations),
  get: (id) => api.get(`/conversations/${id}`).then((r) => r.data.conversation),
  createDirect: (userId) => api.post("/conversations/direct", { userId }).then((r) => r.data.conversation),
  createGroup: (name, memberIds) =>
    api.post("/conversations/group", { name, memberIds }).then((r) => r.data.conversation),
  rename: (id, name) => api.patch(`/conversations/${id}`, { name }).then((r) => r.data.conversation),
  addMembers: (id, userIds) =>
    api.post(`/conversations/${id}/members`, { userIds }).then((r) => r.data.conversation),
  removeMember: (id, userId) => api.delete(`/conversations/${id}/members/${userId}`).then((r) => r.data.conversation),
}

export const messagesApi = {
  list: (conversationId, params) =>
    api.get(`/conversations/${conversationId}/messages`, { params }).then((r) => r.data),
  sendAttachment: (conversationId, { file, content, clientId }, onProgress) => {
    const form = new FormData()
    form.append("file", file)
    if (content) form.append("content", content)
    form.append("clientId", clientId)
    return api
      .post(`/conversations/${conversationId}/messages/attachment`, form, {
        timeout: 120_000,
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      .then((r) => r.data.message)
  },
  edit: (id, content) => api.patch(`/messages/${id}`, { content }).then((r) => r.data.message),
  remove: (id) => api.delete(`/messages/${id}`).then((r) => r.data.message),
}
