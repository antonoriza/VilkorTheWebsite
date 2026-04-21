/**
 * Zod Validation Middleware Factory
 *
 * Wraps @hono/zod-validator with consistent error formatting.
 * Returns 400 with structured error details on validation failure.
 *
 * Usage:
 *   app.post('/pagos', validate('json', createPagoSchema), handler)
 */
import { zValidator } from '@hono/zod-validator'
import type { ZodSchema } from 'zod'

type Target = 'json' | 'query' | 'param' | 'form'

/**
 * Creates a Hono middleware that validates the request body/query/params
 * against a Zod schema. Returns 400 with field-level errors on failure.
 */
export const validate = <T extends ZodSchema>(target: Target, schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))

      return c.json({
        error: 'Validation Error',
        message: `Invalid ${target} data`,
        details: errors,
      }, 400)
    }
  })
