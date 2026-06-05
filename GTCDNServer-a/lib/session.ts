import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import type { Session } from "@/lib/auth-client"
import { auth } from "@/lib/auth"

export async function getSessionFromHeaders(
  requestHeaders: Headers
): Promise<Session | null> {
  return auth.api.getSession({ headers: requestHeaders })
}

export async function getSession(): Promise<Session | null> {
  return getSessionFromHeaders(await headers())
}

export async function requireSession(redirectTo = "/login"): Promise<Session> {
  const session = await getSession()
  if (!session) {
    redirect(redirectTo)
  }

  return session
}

export async function requireRequestSession(
  request: Request
): Promise<Session> {
  const session = await getSessionFromHeaders(request.headers)
  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}
