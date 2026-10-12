// User input inside a RegExp must be escaped, otherwise a query like ".*" or
// "(a+)+$" turns into an expensive or unintended pattern (ReDoS).
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export default escapeRegex
