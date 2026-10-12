// Validates and normalizes request input against zod schemas. Parsed values
// replace the raw ones, so handlers only ever see well-typed data. Because
// every field must match its declared type, this also blocks NoSQL operator
// injection such as { "email": { "$gt": "" } }.
const validate = (schemas) => (req, _res, next) => {
  if (schemas.params) req.params = schemas.params.parse(req.params)
  if (schemas.body) req.body = schemas.body.parse(req.body ?? {})
  if (schemas.query) {
    // req.query is a getter in Express 5, so it has to be redefined, not assigned.
    Object.defineProperty(req, "query", {
      value: schemas.query.parse(req.query),
      writable: true,
      configurable: true,
    })
  }
  next()
}

export default validate
