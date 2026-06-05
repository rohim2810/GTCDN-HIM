import { NextResponse } from "next/server"

import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"
import { listFiles } from "@/lib/storage-server"

export async function GET(request: Request) {
  try {
    const session = await requireRequestSession(request)
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") ?? ""
    const files = await listFiles(path)

    return NextResponse.json({
      currentPath: path,
      files,
      session,
    })
  } catch (error) {
    return jsonError(error, 401)
  }
}
