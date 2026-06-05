import { NextResponse } from "next/server"

import { changeAdminPassword } from "@/lib/admin"
import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const session = await requireRequestSession(request)
    const body = (await request.json()) as { password?: string }
    await changeAdminPassword(session.user.id, body.password ?? "")
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error, 400)
  }
}
