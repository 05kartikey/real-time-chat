import * as conversationService from "../services/conversationService.js"
import * as messageService from "../services/messageService.js"

export const list = async (req, res) => {
  const conversations = await conversationService.listForUser(req.user._id)
  res.json({ conversations })
}

export const getById = async (req, res) => {
  const conversation = await conversationService.getById(req.user._id, req.params.id)
  res.json({ conversation })
}

export const createDirect = async (req, res) => {
  const { conversation, created } = await conversationService.findOrCreateDirect(req.user._id, req.body.userId)
  res.status(created ? 201 : 200).json({ conversation })
}

export const createGroup = async (req, res) => {
  const conversation = await conversationService.createGroup(req.user, req.body)
  res.status(201).json({ conversation })
}

export const rename = async (req, res) => {
  const conversation = await conversationService.rename(req.user, req.params.id, req.body.name)
  res.json({ conversation })
}

export const addMembers = async (req, res) => {
  const conversation = await conversationService.addMembers(req.user, req.params.id, req.body.userIds)
  res.json({ conversation })
}

export const removeMember = async (req, res) => {
  const conversation = await conversationService.removeMember(req.user, req.params.id, req.params.userId)
  res.json({ conversation })
}

export const listMessages = async (req, res) => {
  const result = await messageService.list({
    userId: req.user._id,
    conversationId: req.params.id,
    ...req.query,
  })
  res.json(result)
}

export const sendAttachment = async (req, res) => {
  const message = await messageService.sendAttachment({
    senderId: req.user._id,
    conversationId: req.params.id,
    file: req.file,
    content: req.body.content,
    clientId: req.body.clientId,
  })
  res.status(201).json({ message })
}
