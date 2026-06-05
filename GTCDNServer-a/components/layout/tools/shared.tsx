"use client"

import { useCallback, useRef, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Upload, XCircle } from "lucide-react"

// ─── types ────────────────────────────────────────────────────────────────────

export type Status =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

// ─── helpers ─────────────────────────────────────────────────────────────────

export function saveBlob(data: BlobPart, fileName: string, mime = "octet/stream") {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

// ─── status badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: Status }) {
  if (status.type === "idle") return null
  const isOk = status.type === "success"
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${
        isOk
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {isOk ? (
        <CheckCircle2 className="size-4 shrink-0" />
      ) : (
        <XCircle className="size-4 shrink-0" />
      )}
      {status.message}
    </motion.div>
  )
}

// ─── drop zone ────────────────────────────────────────────────────────────────

export function DropZone({
  accept,
  label,
  sublabel,
  onFile,
}: {
  accept: string
  label: string
  sublabel: string
  onFile: (file: File) => void
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors md:py-14 ${
        dragging
          ? "border-primary bg-primary/8"
          : "border-border/60 hover:border-primary/50 hover:bg-muted/40"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ""
        }}
      />
      <Upload className="size-7 text-muted-foreground" strokeWidth={1.4} />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  )
}

// ─── segmented control ────────────────────────────────────────────────────────

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── stat grid ────────────────────────────────────────────────────────────────

export function StatGrid({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`grid gap-3 ${stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
        >
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{s.value}</p>
        </div>
      ))}
    </motion.div>
  )
}
