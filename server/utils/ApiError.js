// An error with an HTTP status code. Anything thrown as an ApiError is
// considered safe to show the client; everything else becomes a generic 500.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.details = details
  }

  static badRequest(message = "Bad request", details) {
    return new ApiError(400, message, details)
  }

  static unauthorized(message = "Not authorized") {
    return new ApiError(401, message)
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message)
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message)
  }

  static conflict(message = "Conflict", details) {
    return new ApiError(409, message, details)
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, message)
  }
}

export default ApiError
