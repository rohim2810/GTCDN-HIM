import "server-only"

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { like } from "drizzle-orm"

import { db, schema } from "@/lib/db"
import type { FolderOption, StorageObject } from "@/lib/storage"

function normalizePrefix(prefix: string) {
  const trimmed = prefix.trim().replace(/^\/+|\/+$/g, "")
  return trimmed ? `${trimmed}/` : ""
}

function getFolderChain(path: string) {
  const normalized = normalizePrefix(path)
  const parts = normalized.split("/").filter(Boolean)
  const folderParts = path.trim().endsWith("/") ? parts : parts.slice(0, -1)
  return folderParts.map(
    (_, index) => `${folderParts.slice(0, index + 1).join("/")}/`
  )
}

function sortEntries(entries: StorageObject[]) {
  return entries.toSorted((a, b) => {
    if (a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1
    }

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  })
}

async function getStorageClient() {
  return {
    bucket: process.env.R2_BUCKET!,
    client: new S3Client({
      region: process.env.R2_REGION || "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    }),
  }
}

async function upsertFolders(paths: string[]) {
  if (paths.length === 0) return

  const now = new Date()
  await db
    .insert(schema.folder)
    .values(paths.map((path) => ({ path, createdAt: now, updatedAt: now })))
    .onConflictDoUpdate({
      target: schema.folder.path,
      set: { updatedAt: now },
    })
}

async function removeFoldersByPrefix(prefix: string) {
  const normalizedPrefix = normalizePrefix(prefix)
  if (!normalizedPrefix) return

  await db
    .delete(schema.folder)
    .where(like(schema.folder.path, `${normalizedPrefix}%`))
}

function encodeCopySource(bucket: string, key: string) {
  return `${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`
}

function splitFileKey(key: string) {
  const slashIndex = key.lastIndexOf("/")
  const prefix = slashIndex >= 0 ? key.slice(0, slashIndex + 1) : ""
  const fileName = slashIndex >= 0 ? key.slice(slashIndex + 1) : key
  const dotIndex = fileName.lastIndexOf(".")

  if (dotIndex <= 0) {
    return {
      prefix,
      name: fileName,
      extension: "",
    }
  }

  return {
    prefix,
    name: fileName.slice(0, dotIndex),
    extension: fileName.slice(dotIndex),
  }
}

async function keyExists(client: S3Client, bucket: string, key: string) {
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
    return true
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "$metadata" in error &&
      typeof error.$metadata === "object" &&
      error.$metadata &&
      "httpStatusCode" in error.$metadata &&
      error.$metadata.httpStatusCode === 404
    ) {
      return false
    }

    throw error
  }
}

async function resolveUploadKey(client: S3Client, bucket: string, key: string) {
  if (!(await keyExists(client, bucket, key))) {
    return key
  }

  const { prefix, name, extension } = splitFileKey(key)

  for (let index = 1; ; index++) {
    const nextKey = `${prefix}${name} (${index})${extension}`
    if (!(await keyExists(client, bucket, nextKey))) {
      return nextKey
    }
  }
}

async function listAllObjectKeys(client: S3Client, bucket: string, prefix: string) {
  const keys: string[] = []
  let continuationToken: string | undefined

  while (true) {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalizePrefix(prefix),
        ContinuationToken: continuationToken,
      })
    )

    keys.push(
      ...(listed.Contents ?? [])
        .map((item) => item.Key)
        .filter((item): item is string => Boolean(item))
    )

    if (!listed.IsTruncated) {
      break
    }

    continuationToken = listed.NextContinuationToken
  }

  return keys
}

async function prefixExists(client: S3Client, bucket: string, prefix: string) {
  const listed = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: normalizePrefix(prefix),
      MaxKeys: 1,
    })
  )

  return (listed.Contents?.length ?? 0) > 0
}

export async function fileExists(key: string) {
  const { bucket, client } = await getStorageClient()
  return keyExists(client, bucket, key)
}

export async function getAvailableUploadKey(key: string) {
  const { bucket, client } = await getStorageClient()
  return resolveUploadKey(client, bucket, key)
}

export async function listFiles(prefix = ""): Promise<StorageObject[]> {
  const normalizedPrefix = normalizePrefix(prefix)
  const { bucket, client } = await getStorageClient()
  const listed = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: normalizedPrefix,
      Delimiter: "/",
    })
  )

  const folders = (listed.CommonPrefixes ?? [])
    .map((folder) => folder.Prefix)
    .filter((folderKey): folderKey is string => Boolean(folderKey))
    .map<StorageObject>((folderKey) => ({
      key: folderKey,
      name: folderKey.slice(normalizedPrefix.length).replace(/\/$/, ""),
      size: 0,
      uploaded: new Date(0).toISOString(),
      isFolder: true,
    }))

  const files = (listed.Contents ?? [])
    .filter(
      (object) =>
        object.Key &&
        object.Key !== normalizedPrefix &&
        !object.Key.endsWith("/")
    )
    .map<StorageObject>((object) => ({
      key: object.Key as string,
      name: (object.Key as string).slice(normalizedPrefix.length),
      size: object.Size ?? 0,
      uploaded: object.LastModified?.toISOString() ?? new Date(0).toISOString(),
      isFolder: false,
    }))

  return sortEntries([...folders, ...files])
}

export async function listFolders(): Promise<FolderOption[]> {
  const { bucket, client } = await getStorageClient()
  const discovered = new Set<string>()

  async function visit(prefix = ""): Promise<void> {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalizePrefix(prefix),
        Delimiter: "/",
      })
    )

    const folderKeys = (listed.CommonPrefixes ?? [])
      .map((folder) => folder.Prefix)
      .filter((folderKey): folderKey is string => Boolean(folderKey))

    for (const folderKey of folderKeys) {
      if (discovered.has(folderKey)) continue
      discovered.add(folderKey)
      await visit(folderKey)
    }
  }

  await visit()

  return [
    { key: "", name: "Root" },
    ...Array.from(discovered)
      .toSorted((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      )
      .map((folderKey) => ({
        key: folderKey,
        name: folderKey.slice(0, -1),
      })),
  ]
}

export async function uploadFile(
  key: string,
  body: ReadableStream | ArrayBuffer,
  contentType: string
): Promise<string> {
  const { bucket, client } = await getStorageClient()
  const payload = body instanceof ArrayBuffer ? new Uint8Array(body) : body
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: payload,
      ContentType: contentType,
    })
  )
  await upsertFolders(getFolderChain(key))
  return key
}

export async function createPresignedUpload(
  key: string,
  contentType: string
): Promise<string> {
  const { bucket, client } = await getStorageClient()

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 10 }
  )
}

export async function finalizeUploadedFile(key: string): Promise<void> {
  await upsertFolders(getFolderChain(key))
}

export async function createFolder(key: string): Promise<void> {
  const normalizedKey = normalizePrefix(key)
  const { bucket, client } = await getStorageClient()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: normalizedKey,
      Body: "",
      ContentType: "application/x-directory",
    })
  )

  await upsertFolders(getFolderChain(normalizedKey))
}

export async function getDownloadFile(key: string): Promise<{
  body: ReadableStream
  contentLength: number
  contentType: string
}> {
  const { bucket, client } = await getStorageClient()
  const object = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )

  if (!object.Body) {
    throw new Error("File not found")
  }

  const body =
    "transformToWebStream" in object.Body
      ? await object.Body.transformToWebStream()
      : (object.Body as ReadableStream)

  return {
    body,
    contentLength: object.ContentLength ?? 0,
    contentType: object.ContentType || "application/octet-stream",
  }
}

export async function deleteFile(key: string): Promise<void> {
  const { bucket, client } = await getStorageClient()

  if (key.endsWith("/")) {
    let continuationToken: string | undefined
    let deletedAny = false

    while (true) {
      const listed = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: normalizePrefix(key),
          ContinuationToken: continuationToken,
        })
      )

      const objects = (listed.Contents ?? [])
        .map((item) => item.Key)
        .filter((item): item is string => Boolean(item))
        .map((item) => ({ Key: item }))

      if (objects.length > 0) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: objects, Quiet: true },
          })
        )
        deletedAny = true
      }

      if (!listed.IsTruncated) {
        break
      }

      continuationToken = listed.NextContinuationToken
    }

    if (!deletedAny) {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: normalizePrefix(key) })
      )
    }

    await removeFoldersByPrefix(key)
    return
  }

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

export async function moveFile(
  sourceKey: string,
  destinationPrefix: string
): Promise<string> {
  const normalizedPrefix = normalizePrefix(destinationPrefix)
  const fileName = sourceKey.split("/").pop()
  if (!fileName) throw new Error("Invalid file key")

  const nextKey = `${normalizedPrefix}${fileName}`
  if (nextKey === sourceKey) {
    throw new Error("File is already in that folder")
  }

  const { bucket, client } = await getStorageClient()
  const object = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: sourceKey,
    })
  )

  if (!object.Body) {
    throw new Error("File not found")
  }

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: nextKey,
      CopySource: encodeCopySource(bucket, sourceKey),
      ContentType: object.ContentType || "application/octet-stream",
      MetadataDirective: "REPLACE",
    })
  )

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: sourceKey }))
  await upsertFolders(getFolderChain(nextKey))

  return nextKey
}

export async function renameFile(
  sourceKey: string,
  nextName: string
): Promise<string> {
  const trimmedName = nextName.trim()
  if (!trimmedName) {
    throw new Error("Missing file name")
  }

  if (trimmedName.includes("/")) {
    throw new Error("File name cannot include slashes")
  }

  const slashIndex = sourceKey.lastIndexOf("/")
  const prefix = slashIndex >= 0 ? sourceKey.slice(0, slashIndex + 1) : ""
  const nextKey = `${prefix}${trimmedName}`

  if (nextKey === sourceKey) {
    throw new Error("File already has that name")
  }

  const { bucket, client } = await getStorageClient()

  if (await keyExists(client, bucket, nextKey)) {
    throw new Error("A file with that name already exists")
  }

  const object = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: sourceKey,
    })
  )

  if (!object.Body) {
    throw new Error("File not found")
  }

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: nextKey,
      CopySource: encodeCopySource(bucket, sourceKey),
      ContentType: object.ContentType || "application/octet-stream",
      MetadataDirective: "REPLACE",
    })
  )

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: sourceKey }))

  return nextKey
}

export async function renameFolder(
  sourceKey: string,
  nextName: string
): Promise<string> {
  const sourcePrefix = normalizePrefix(sourceKey)
  const trimmedName = nextName.trim().replace(/^\/+|\/+$/g, "")

  if (!sourcePrefix) {
    throw new Error("Missing folder")
  }

  if (!trimmedName) {
    throw new Error("Missing folder name")
  }

  if (trimmedName.includes("/")) {
    throw new Error("Folder name cannot include slashes")
  }

  const sourceParts = sourcePrefix.split("/").filter(Boolean)
  sourceParts.pop()
  const parentPrefix = sourceParts.length > 0 ? `${sourceParts.join("/")}/` : ""
  const nextPrefix = `${parentPrefix}${trimmedName}/`

  if (nextPrefix === sourcePrefix) {
    throw new Error("Folder already has that name")
  }

  const { bucket, client } = await getStorageClient()

  if (await prefixExists(client, bucket, nextPrefix)) {
    throw new Error("A folder with that name already exists")
  }

  const objectKeys = await listAllObjectKeys(client, bucket, sourcePrefix)

  if (objectKeys.length === 0) {
    throw new Error("Folder not found")
  }

  const nextFolderPaths = new Set<string>()

  for (const key of objectKeys) {
    const renamedKey = `${nextPrefix}${key.slice(sourcePrefix.length)}`

    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: renamedKey,
        CopySource: encodeCopySource(bucket, key),
        MetadataDirective: "COPY",
      })
    )

    nextFolderPaths.add(renamedKey)
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objectKeys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    })
  )

  await removeFoldersByPrefix(sourcePrefix)
  await upsertFolders([
    ...new Set(
      [...nextFolderPaths].flatMap((key) => getFolderChain(key).concat(nextPrefix))
    ),
  ])

  return nextPrefix
}
