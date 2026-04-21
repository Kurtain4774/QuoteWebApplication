const { ZodError } = require('zod');

// Usage: router.post('/path', validate({ body: schema, params: schema, query: schema }), handler)
// On success, req.body/params/query are replaced with the parsed (coerced, stripped) values.
// req.query is left un-mutated because Express 5 makes it read-only; handlers can re-parse from schemas.query.parse(req.query) if coerced values are needed.
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body)   req.body   = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query)  schemas.query.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: err.issues[0]?.message || 'Invalid request',
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
      }
      next(err);
    }
  };
}

module.exports = validate;
