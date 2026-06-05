import "server-only"

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { hashPassword } from "better-auth/crypto"
import { nextCookies } from "better-auth/next-js"
import { eq } from "drizzle-orm"

import { db, schema } from "@/lib/db"
import {
  DEFAULT_USER_PASSWORD,
  DEFAULT_USER_EMAIL,
  DEFAULT_USER_NAME,
} from "@/lib/constants"
let seeded = false
let seedPromise: Promise<void> | null = null

async function seedDefaultUser() {
  if (seeded) return
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const [existing] = await db
          .select({ id: schema.user.id })
          .from(schema.user)
          .where(eq(schema.user.email, DEFAULT_USER_EMAIL))
          .limit(1)

        if (!existing) {
          const userId = crypto.randomUUID()
          const accountId = crypto.randomUUID()
          const now = new Date().toISOString()
          const passwordHash = await hashPassword(DEFAULT_USER_PASSWORD)

          await db.insert(schema.user).values({
            id: userId,
            name: DEFAULT_USER_NAME,
            email: DEFAULT_USER_EMAIL,
            emailVerified: true,
            image: null,
            createdAt: new Date(now),
            updatedAt: new Date(now),
          })

          await db.insert(schema.account).values({
            id: accountId,
            accountId: userId,
            providerId: "credential",
            userId,
            password: passwordHash,
            scope: null,
            createdAt: new Date(now),
            updatedAt: new Date(now),
          })
        }
      } finally {
        seeded = true
      }
    })()
  }

  await seedPromise
}

const autoBootstrap = (
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
).includes("localhost")

if (autoBootstrap) {
  void seedDefaultUser().catch(() => {
    seeded = false
    seedPromise = null
  })
}

export const auth = betterAuth({
  appName: "GTCDN",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [nextCookies()],
})
