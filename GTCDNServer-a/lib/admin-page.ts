import type { Session } from "@/lib/auth-client"
import type { FolderOption, StorageObject } from "@/lib/storage"

export type AdminPageData = {
  currentPath: string
  files: StorageObject[]
  session: Session
}

export type UploadConflictAction = "replace" | "rename"

export type UploadConflictResponse = {
  error: string
  conflict: true
  key: string
  suggestedKey: string
}

export type UploadDirectResponse = {
  key: string
  uploadUrl: string
}

export type UploadedFileResult = {
  originalName: string
  uploadedName: string
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatUploadedDate(value: string, useLocalTime: boolean) {
  return new Intl.DateTimeFormat(useLocalTime ? undefined : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: useLocalTime ? undefined : "UTC",
  }).format(new Date(value))
}

export function normalizePath(path: string) {
  return path.trim().replace(/^\/+|\/+$/g, "")
}

export function getParentPath(path: string) {
  const normalized = normalizePath(path)
  if (!normalized) return ""

  const parts = normalized.split("/")
  parts.pop()
  return parts.join("/")
}

export function getBreadcrumbs(path: string) {
  const normalized = normalizePath(path)
  if (!normalized) return [] as Array<{ label: string; path: string }>

  const parts = normalized.split("/")
  return parts.map((part, index) => ({
    label: part,
    path: parts.slice(0, index + 1).join("/"),
  }))
}

export function formatFolderLabel(folder: FolderOption) {
  return folder.key ? folder.name : "/"
}

export function mergeUploadQueue(current: File[], incoming: File[]) {
  const merged = [...current]

  for (const file of incoming) {
    const exists = merged.some(
      (item) =>
        item.name === file.name &&
        item.size === file.size &&
        item.lastModified === file.lastModified
    )

    if (!exists) {
      merged.push(file)
    }
  }

  return merged
}

export async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(errorBody?.error || "Request failed")
  }

  return response.json() as Promise<T>
}

export function getUploadSuccessDescription(filesToUpload: UploadedFileResult[]) {
  if (filesToUpload.length === 1) {
    const file = filesToUpload[0]

    if (!file) {
      return "1 file has been uploaded successfully."
    }

    if (file.originalName !== file.uploadedName) {
      return `"${file.originalName}" has been uploaded successfully with name "${file.uploadedName}".`
    }

    return `"${file.originalName}" has been uploaded successfully.`
  }

  return `${filesToUpload.length} files has been upload successfully.`
}

export function getFileNameFromKey(key: string) {
  return key.split("/").pop() || key
}

export function isDatFileName(name: string) {
  return /\.dat$/i.test(name)
}

export function getDecodedJsonFileName(name: string) {
  return name.replace(/\.dat$/i, "") + ".json"
}

export function buildPublicFileUrl(key: string) {
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim()

  if (!baseUrl) {
    return null
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return `${normalizedBaseUrl}/${encodedKey}`
}
