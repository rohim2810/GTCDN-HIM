import { NextResponse } from "next/server"

import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"
import { deleteFile, listFiles } from "@/lib/storage-server"

export async function GET(request: Request) {
  try {
    await requireRequestSession(request)
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") ?? ""
    return NextResponse.json(await listFiles(path))
  } catch (error) {
    return jsonError(error, 401)
  }
}

export async function DELETE(request: Request) {
  try {
    await requireRequestSession(request)
    const body = (await request.json()) as { key?: string }
    if (!body.key) {
      return jsonError("Missing file key", 400)
    }

    await deleteFile(body.key)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error, 400)
  }
}
