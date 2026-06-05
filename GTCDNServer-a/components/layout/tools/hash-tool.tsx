"use client"

import { useCallback, useState } from "react"
import { AnimatePresence } from "framer-motion"

import { protonHash } from "@/lib/items-dat-helper"
import { DropZone, StatGrid, StatusBadge, type Status } from "./shared"

export function HashTool() {
  const [status, setStatus] = useState<Status>({ type: "idle" })
  const [hashValue, setHashValue] = useState<number | null>(null)

  const handleFile = useCallback((file: File) => {
    setStatus({ type: "idle" })
    setHashValue(null)
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = (e) => {
      try {
        const buf = new Uint8Array(e.target!.result as ArrayBuffer)
        const hash = protonHash(buf)
        setHashValue(hash)
        setStatus({ type: "success", message: `Hash computed for "${file.name}"` })
      } catch (err) {
        setStatus({
          type: "error",
          message: err instanceof Error ? err.message : "Hash failed",
        })
      }
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Compute the Growtopia proton hash (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">0x55555555</code>{" "}
        rolling XOR/shift) for any file. Used to verify{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">items.dat</code>{" "}
        integrity before deployment.
      </p>

      <DropZone
        accept="*"
        label="Drop any file here"
        sublabel="or click to browse"
        onFile={handleFile}
      />

      <AnimatePresence>
        <StatusBadge status={status} />
      </AnimatePresence>

      {hashValue !== null && (
        <StatGrid stats={[{ label: "Decimal", value: String(hashValue >>> 0) }]} />
      )}
    </div>
  )
}
