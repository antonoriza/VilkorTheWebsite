/**
 * Better Auth Configuration
 *
 * Manages user authentication, sessions, and account lifecycle
 * against the master.db database.
 */
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { masterDb } from './db/master'
import * as masterSchema from './db/schema/master'

export const auth = betterAuth({
  database: drizzleAdapter(masterDb, {
    provider: 'sqlite',
    schema: masterSchema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 4,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  trustedOrigins: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
  ],
})

export type AuthUser = typeof auth.$Infer.Session.user
export type AuthSession = typeof auth.$Infer.Session.session
