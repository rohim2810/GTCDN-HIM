"use client"

import { useCallback, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Download } from "lucide-react"

import { protonHash } from "@/lib/items-dat-helper"
import { pngToRttex, rttexToPng, type RttexInfo } from "@/lib/rttex-helper"
import { DropZone, saveBlob, SegmentedControl, StatGrid, StatusBadge, type Status } from "./shared"

type RttexDirection = "rttex_to_png" | "png_to_rttex"

export function RttexTool() {
  const [direction, setDirection] = useState<RttexDirection>("rttex_to_png")
  const [status, setStatus] = useState<Status>({ type: "idle" })
  const [info, setInfo] = useState<RttexInfo | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hashValue, setHashValue] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDirectionChange = (d: RttexDirection) => {
    setDirection(d)
    setStatus({ type: "idle" })
    setInfo(null)
    setPreviewUrl(null)
    setHashValue(null)
  }

  const handleFile = useCallback(
    (file: File) => {
      setStatus({ type: "idle" })
      setInfo(null)
      setPreviewUrl(null)
      setHashValue(null)

      if (!canvasRef.current) return

      if (direction === "rttex_to_png") {
        const reader = new FileReader()
        reader.readAsArrayBuffer(file)
        reader.onload = (e) => {
          try {
            const buf = new Uint8Array(e.target!.result as ArrayBuffer)
            const { dataUrl, info: texInfo } = rttexToPng(buf, canvasRef.current!)
            setInfo(texInfo)
            setPreviewUrl(dataUrl)
            setStatus({
              type: "success",
              message: `Decoded "${file.name}" — ${texInfo.width}×${texInfo.height}`,
            })
          } catch (err) {
            setStatus({
              type: "error",
              message: err instanceof Error ? err.message : "Conversion failed",
            })
          }
        }
      } else {
        if (!file.type.startsWith("image/")) {
          setStatus({ type: "error", message: "Not a valid image file" })
          return
        }
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (e) => {
          const img = new Image()
          img.src = e.target!.result as string
          img.onload = () => {
            try {
              const result = pngToRttex(img, canvasRef.current!)
              const baseName = file.name.replace(/\.[^.]+$/, "")
              const resultBuf = new Uint8Array(result)
              const hash = protonHash(resultBuf)
              saveBlob(resultBuf.buffer as ArrayBuffer, `${baseName}.rttex`)
              setHashValue(hash >>> 0)
              setStatus({
                type: "success",
                message: `Encoded "${file.name}" — ${img.width}×${img.height} — ${baseName}.rttex downloaded`,
              })
              setInfo({ width: img.width, height: img.height, usesAlpha: true, compressed: true })
            } catch (err) {
              setStatus({
                type: "error",
                message: err instanceof Error ? err.message : "Conversion failed",
              })
            }
          }
        }
      }
    },
    [direction],
  )

  const isToPNG = direction === "rttex_to_png"

  return (
    <div className="flex flex-col gap-6">
      {/* hidden canvas for pixel processing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl<RttexDirection>
          options={[
            { label: "RTTEX → PNG", value: "rttex_to_png" },
            { label: "PNG → RTTEX", value: "png_to_rttex" },
          ]}
          value={direction}
          onChange={handleDirectionChange}
        />
        <span className="text-xs text-muted-foreground">
          {isToPNG ? ".rttex → .png" : ".png → .rttex (RTPACK)"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={direction}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="text-sm text-muted-foreground"
        >
          {isToPNG ? (
            <>
              Drop a{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.rttex</code>{" "}
              file to decode it into a PNG image. RTPACK-wrapped files are supported and
              decompressed automatically.
            </>
          ) : (
            <>
              Drop a{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.png</code>{" "}
              image to encode it into a Growtopia-compatible{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.rttex</code>{" "}
              (RTPACK zlib-compressed).
            </>
          )}
        </motion.p>
      </AnimatePresence>

      <DropZone
        key={direction}
        accept={isToPNG ? "*" : "image/*"}
        label={isToPNG ? "Drop .rttex file here" : "Drop .png image here"}
        sublabel="or click to browse"
        onFile={handleFile}
      />

      <AnimatePresence>
        <StatusBadge status={status} />
      </AnimatePresence>

      {info && status.type === "success" && (
        <StatGrid
          stats={[
            { label: "Width", value: `${info.width}px` },
            { label: "Height", value: `${info.height}px` },
            { label: "Alpha", value: info.usesAlpha ? "Yes" : "No" },
            ...(hashValue !== null ? [{ label: "Proton Hash", value: String(hashValue) }] : []),
          ]}
        />
      )}

      {previewUrl && isToPNG && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
            <a
              href={previewUrl}
              download="output.png"
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="size-3.5" />
              Download PNG
            </a>
          </div>
          {/* @note checkerboard bg to show transparency */}
          <div
            className="overflow-hidden rounded-xl border border-border/60"
            style={{
              backgroundImage:
                "repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 16px 16px",
            }}
          >
            <img
              src={previewUrl}
              alt="RTTEX preview"
              className="block max-h-96 w-full object-contain"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
