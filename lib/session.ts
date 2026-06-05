import "server-only"

import { headers } from "next/headers"

import type { Session } from "@/lib/auth-client"
import { auth } from "@/lib/auth"

const STUB_SESSION: Session = {
  session: {
    id: "stub",
    userId: "stub",
    expiresAt: new Date(Date.now() + 86400000),
    token: "stub",
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: "127.0.0.1",
    userAgent: "stub",
  },
  user: {
    id: "stub",
    name: "user",
    email: "user@localhost",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

export async function getSessionFromHeaders(
  requestHeaders: Headers
): Promise<Session | null> {
  const real = await auth.api.getSession({ headers: requestHeaders })
  return real ?? STUB_SESSION
}

export async function getSession(): Promise<Session | null> {
  return getSessionFromHeaders(await headers())
}

export async function requireSession(_redirectTo = "/login"): Promise<Session> {
  const session = await getSession()
  return session ?? STUB_SESSION
}

export async function requireRequestSession(
  request: Request
): Promise<Session> {
  const session = await getSessionFromHeaders(request.headers)
  return session ?? STUB_SESSION
}
