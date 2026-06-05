const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${req.method} ${req.url} - ${message}`)
  }

  res.status(status).json({ message })
}

export default errorHandler
