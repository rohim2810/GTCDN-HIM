import "server-only"

import { hashPassword } from "better-auth/crypto"
import { and, eq } from "drizzle-orm"

import { db, schema } from "@/lib/db"
import { getSession } from "@/lib/session"
import { listFiles } from "@/lib/storage-server"

export async function getAdminPageData(path: string) {
  const session = await getSession()
  if (!session) {
    return null
  }

  const files = await listFiles(path)

  return {
    currentPath: path,
    files,
    session,
  }
}

export async function changeAdminPassword(userId: string, newPassword: string) {
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters")
  }

  const passwordHash = await hashPassword(newPassword)
  await db
    .update(schema.account)
    .set({
      password: passwordHash,
      scope: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "credential")
      )
    )
}
