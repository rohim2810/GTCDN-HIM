import { NextResponse } from "next/server"

import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"
import { moveFile } from "@/lib/storage-server"

export async function POST(request: Request) {
  try {
    await requireRequestSession(request)
    const body = (await request.json()) as {
      sourceKey?: string
      destinationPrefix?: string
    }

    if (!body.sourceKey) {
      return jsonError("Missing source file", 400)
    }

    if (body.sourceKey.endsWith("/")) {
      return jsonError("Only files can be moved", 400)
    }

    const key = await moveFile(body.sourceKey, body.destinationPrefix ?? "")
    return NextResponse.json({ key })
  } catch (error) {
    return jsonError(error, 400)
  }
}
