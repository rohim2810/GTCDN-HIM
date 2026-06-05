import { NextResponse } from "next/server"

import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"
import {
  createPresignedUpload,
  fileExists,
  getAvailableUploadKey,
} from "@/lib/storage-server"

export async function POST(request: Request) {
  try {
    await requireRequestSession(request)
    const body = (await request.json()) as {
      path?: string
      key?: string
      fileName?: string
      contentType?: string
      conflictAction?: string
    }

    const path = (body.path ?? "").trim()
    const normalizedPath = path.replace(/^\/+|\/+$/g, "")
    const fileName = body.fileName?.trim()

    if (!body.key && !fileName) {
      return jsonError("Missing file name", 400)
    }

    const baseKey =
      body.key?.trim() ??
      `${normalizedPath ? `${normalizedPath}/` : ""}${fileName}`
    const conflictAction = body.conflictAction

    let key = baseKey

    if (conflictAction === "rename") {
      key = await getAvailableUploadKey(baseKey)
    } else if (conflictAction !== "replace" && (await fileExists(baseKey))) {
      return NextResponse.json(
        {
          error: "A file with the same name already exists in this folder.",
          conflict: true,
          key: baseKey,
          suggestedKey: await getAvailableUploadKey(baseKey),
        },
        { status: 409 }
      )
    }

    const uploadUrl = await createPresignedUpload(
      key,
      body.contentType || "application/octet-stream"
    )

    return NextResponse.json({ key, uploadUrl })
  } catch (error) {
    return jsonError(error, 400)
  }
}
