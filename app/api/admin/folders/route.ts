import { NextResponse } from "next/server"

import { jsonError } from "@/lib/http"
import { requireRequestSession } from "@/lib/session"
import { createFolder, listFolders, renameFolder } from "@/lib/storage-server"

export async function GET(request: Request) {
  try {
    await requireRequestSession(request)
    return NextResponse.json(await listFolders())
  } catch (error) {
    return jsonError(error, 401)
  }
}

export async function POST(request: Request) {
  try {
    await requireRequestSession(request)
    const body = (await request.json()) as {
      folderName?: string
      path?: string
    }
    const folderName = body.folderName?.trim().replace(/^\/+|\/+$/g, "") ?? ""
    const currentPath = body.path?.trim().replace(/^\/+|\/+$/g, "") ?? ""

    if (!folderName) {
      return jsonError("Folder name is required", 400)
    }

    const key = `${currentPath ? `${currentPath}/` : ""}${folderName}/`
    await createFolder(key)
    return NextResponse.json({ key })
  } catch (error) {
    return jsonError(error, 400)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRequestSession(request)
    const body = (await request.json()) as {
      sourceKey?: string
      nextName?: string
    }

    if (!body.sourceKey) {
      return jsonError("Missing folder", 400)
    }

    if (!body.sourceKey.endsWith("/")) {
      return jsonError("Only folders can be renamed here", 400)
    }

    if (!body.nextName?.trim()) {
      return jsonError("Missing folder name", 400)
    }

    const key = await renameFolder(body.sourceKey, body.nextName)
    return NextResponse.json({ key })
  } catch (error) {
    return jsonError(error, 400)
  }
}
