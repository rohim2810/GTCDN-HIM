import { NextResponse } from "next/server"

import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"
import { renameFile } from "@/lib/storage-server"

export async function POST(request: Request) {
  try {
    await requireRequestSession(request)
    const body = (await request.json()) as {
      sourceKey?: string
      nextName?: string
    }

    if (!body.sourceKey) {
      return jsonError("Missing source file", 400)
    }

    if (body.sourceKey.endsWith("/")) {
      return jsonError("Only files can be renamed", 400)
    }

    if (!body.nextName?.trim()) {
      return jsonError("Missing file name", 400)
    }

    const key = await renameFile(body.sourceKey, body.nextName)
    return NextResponse.json({ key })
  } catch (error) {
    return jsonError(error, 400)
  }
}
