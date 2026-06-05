import { NextResponse } from "next/server"

import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"
import { finalizeUploadedFile } from "@/lib/storage-server"

export async function POST(request: Request) {
  try {
    await requireRequestSession(request)
    const body = (await request.json()) as { key?: string }

    if (!body.key?.trim()) {
      return jsonError("Missing file key", 400)
    }

    await finalizeUploadedFile(body.key)
    return NextResponse.json({ key: body.key })
  } catch (error) {
    return jsonError(error, 400)
  }
}
