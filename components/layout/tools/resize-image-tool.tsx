"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import NextImage from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Download, ImageUp, Lock, Unlock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropZone, SegmentedControl, StatGrid, StatusBadge, type Status } from "./shared"

type FilterMode = "nearest" | "smooth"
type SourceImage = {
  fileName: string
  url: string
  width: number
  height: number
}

function clampDimension(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1
  return Math.round(value)
}

export function ResizeImageTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [status, setStatus] = useState<Status>({ type: "idle" })
  const [source, setSource] = useState<SourceImage | null>(null)
  const [width, setWidth] = useState(64)
  const [height, setHeight] = useState(64)
  const [filter, setFilter] = useState<FilterMode>("nearest")
  const [lockAspectRatio, setLockAspectRatio] = useState(true)

  const handleFile = useCallback((file: File) => {
    setStatus({ type: "idle" })

    const nextUrl = URL.createObjectURL(file)
    const img = new globalThis.Image()

    img.addEventListener("load", () => {
      imgRef.current = img
      setSource((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url)
        return {
          fileName: file.name,
          url: nextUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
        }
      })
      setWidth(img.naturalWidth)
      setHeight(img.naturalHeight)
      setStatus({
        type: "success",
        message: `Loaded "${file.name}" — ${img.naturalWidth}×${img.naturalHeight}`,
      })
    })

    img.addEventListener("error", () => {
      URL.revokeObjectURL(nextUrl)
      imgRef.current = null
      setSource(null)
      setStatus({ type: "error", message: "Not a valid image file" })
    })

    img.src = nextUrl
  }, [])

  useEffect(() => {
    return () => {
      if (source?.url) URL.revokeObjectURL(source.url)
    }
  }, [source?.url])

  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !source) return

    const nextWidth = clampDimension(width)
    const nextHeight = clampDimension(height)
    canvas.width = nextWidth
    canvas.height = nextHeight

    const context = canvas.getContext("2d")
    if (!context) return

    context.clearRect(0, 0, nextWidth, nextHeight)
    context.imageSmoothingEnabled = filter === "smooth"
    context.imageSmoothingQuality = filter === "smooth" ? "high" : "low"
    context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, nextWidth, nextHeight)
  }, [filter, height, source, width])

  const aspectRatio = useMemo(() => {
    if (!source || source.height === 0) return 1
    return source.width / source.height
  }, [source])

  const handleWidthChange = (value: string) => {
    const nextWidth = clampDimension(Number(value))
    setWidth(nextWidth)
    if (lockAspectRatio && source) {
      setHeight(clampDimension(nextWidth / aspectRatio))
    }
  }

  const handleHeightChange = (value: string) => {
    const nextHeight = clampDimension(Number(value))
    setHeight(nextHeight)
    if (lockAspectRatio && source) {
      setWidth(clampDimension(nextHeight * aspectRatio))
    }
  }

  const handleDownload = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !source) return

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
    if (!blob) {
      setStatus({ type: "error", message: "Failed to prepare PNG download" })
      return
    }

    const baseName = source.fileName.replace(/\.[^.]+$/, "")
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${baseName}-${width}x${height}.png`
    anchor.click()
    URL.revokeObjectURL(url)

    setStatus({
      type: "success",
      message: `Resized image downloaded as ${baseName}-${width}x${height}.png`,
    })
  }, [height, source, width])

  return (
    <div className="flex flex-col gap-6">
      <canvas ref={canvasRef} className="hidden" />

      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.14 }}
        className="text-sm text-muted-foreground"
      >
        Drop an image to resize it into a clean PNG export. Use{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Nearest</code> for pixel
        art or <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Smooth</code> for
        softer scaling.
      </motion.p>

      <DropZone
        accept="image/*"
        label="Drop image here"
        sublabel="or click to browse — png recommended"
        onFile={handleFile}
      />

      <AnimatePresence>
        <StatusBadge status={status} />
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.8fr)]">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Resize Controls
              </p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">Target Output</h3>
            </div>
            <SegmentedControl<FilterMode>
              options={[
                { label: "Nearest", value: "nearest" },
                { label: "Smooth", value: "smooth" },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="resize-image-width"
                className="text-xs font-medium text-muted-foreground"
              >
                Width
              </label>
              <input
                id="resize-image-width"
                type="number"
                min={1}
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="resize-image-height"
                className="text-xs font-medium text-muted-foreground"
              >
                Height
              </label>
              <input
                id="resize-image-height"
                type="number"
                min={1}
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-4 shadow-none"
              onClick={() => setLockAspectRatio((prev) => !prev)}
            >
              {lockAspectRatio ? <Lock className="size-4" /> : <Unlock className="size-4" />}
              {lockAspectRatio ? "Aspect Locked" : "Free Resize"}
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full px-4"
              onClick={handleDownload}
              disabled={!source}
            >
              <Download className="size-4" />
              Download PNG
            </Button>
          </div>

          {source && (
            <StatGrid
              stats={[
                { label: "Source", value: `${source.width}×${source.height}` },
                { label: "Output", value: `${width}×${height}` },
                { label: "Filter", value: filter === "nearest" ? "Nearest" : "Smooth" },
              ]}
            />
          )}
        </div>

        <div className="flex min-h-[340px] flex-col rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Preview
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {source ? source.fileName : "No image selected"}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ImageUp className="size-4" strokeWidth={1.7} />
            </div>
          </div>

          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl border border-border/60 bg-background/80 p-4"
            style={{
              backgroundImage:
                "repeating-conic-gradient(color-mix(in oklch, var(--color-border) 52%, transparent) 0% 25%, transparent 0% 50%)",
              backgroundPosition: "center",
              backgroundSize: "18px 18px",
            }}
          >
            {source ? (
              <NextImage
                src={source.url}
                alt={source.fileName}
                unoptimized
                style={{ imageRendering: filter === "nearest" ? "pixelated" : "auto" }}
                className="block h-auto max-h-full w-auto max-w-full rounded-lg shadow-[0_14px_38px_-18px_color-mix(in_oklch,var(--color-primary)_18%,black_40%)]"
                width={width}
                height={height}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Loading preview starts after you drop an image.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
