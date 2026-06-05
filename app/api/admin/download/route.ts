import { NextResponse } from "next/server"

import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"
import { getDownloadFile } from "@/lib/storage-server"

function encodeContentDispositionFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/['()]/g, escape).replace(/\*/g, "%2A")
}

export async function GET(request: Request) {
  try {
    await requireRequestSession(request)
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")?.trim()

    if (!key) {
      return jsonError("Missing file", 400)
    }

    if (key.endsWith("/")) {
      return jsonError("Only files can be downloaded", 400)
    }

    const file = await getDownloadFile(key)
    const fileName = key.split("/").pop() || "download"

    return new NextResponse(file.body, {
      headers: {
        "content-type": file.contentType,
        "content-length": `${file.contentLength}`,
        "content-disposition": `attachment; filename="${fileName.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodeContentDispositionFileName(fileName)}`,
      },
    })
  } catch (error) {
    return jsonError(error, 400)
  }
}
