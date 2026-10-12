import * as messageService from "../services/messageService.js"

export const edit = async (req, res) => {
  const message = await messageService.edit({
    userId: req.user._id,
    messageId: req.params.id,
    content: req.body.content,
  })
  res.json({ message })
}

export const remove = async (req, res) => {
  const message = await messageService.remove({ userId: req.user._id, messageId: req.params.id })
  res.json({ message })
}
