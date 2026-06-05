"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRightLeft,
  Binary,
  ChevronRight,
  FileEdit,
  Hash,
  ImageIcon,
  ScanSearch,
} from "lucide-react"

import Navbar from "@/components/layout/navbar"
import { ConverterTool } from "@/components/layout/tools/converter-tool"
import { HashTool } from "@/components/layout/tools/hash-tool"
import { EditorTool } from "@/components/layout/tools/editor-tool"
import { RttexTool } from "@/components/layout/tools/rttex-tool"
import { ResizeImageTool } from "@/components/layout/tools/resize-image-tool"

// ─── nav config ──────────────────────────────────────────────────────────────

const toolGroups = [
  {
    title: "Items.dat Tools",
    items: [
      { label: "Converter", id: "converter", icon: ArrowRightLeft },
      { label: "Editor", id: "editor", icon: FileEdit },
      { label: "Proton Hash", id: "hash", icon: Hash },
    ],
  },
  {
    title: "Media Tools",
    items: [
      { label: "RTTEX Converter", id: "rttex", icon: ImageIcon },
      { label: "Resize Image", id: "resize-image", icon: ScanSearch },
    ],
  },
]

type ToolId = "converter" | "hash" | "editor" | "rttex" | "resize-image"

const toolMeta: Record<
  ToolId,
  { icon: React.ElementType; eyebrow: string; title: string; description: string }
> = {
  converter: {
    icon: ArrowRightLeft,
    eyebrow: "Items.dat Tools",
    title: "Converter",
    description: "Decode or encode items.dat to JSON / TXT",
  },
  hash: {
    icon: Hash,
    eyebrow: "Items.dat Tools",
    title: "Proton Hash",
    description: "Compute the Growtopia proton hash for any file",
  },
  editor: {
    icon: FileEdit,
    eyebrow: "Items.dat Tools",
    title: "Editor",
    description: "Browse, edit, and re-export items.dat fields",
  },
  rttex: {
    icon: ImageIcon,
    eyebrow: "Media Tools",
    title: "RTTEX Converter",
    description: "Convert RTTEX textures to PNG and back",
  },
  "resize-image": {
    icon: ScanSearch,
    eyebrow: "Media Tools",
    title: "Resize Image",
    description: "Resize images into clean PNG exports with pixel or smooth scaling",
  },
}

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId>("converter")
  const meta = toolMeta[activeTool]
  const Icon = meta.icon

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar />

      {/* mobile tab strip */}
      <div className="flex shrink-0 border-b border-border/60 bg-background md:hidden">
        {toolGroups.flatMap((g) => g.items).map((item) => {
          const ItemIcon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTool(item.id as ToolId)}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                activeTool === item.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ItemIcon className="size-4" strokeWidth={1.6} />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden w-full">
        {/* floating sidebar — desktop only */}
        <div className="hidden w-60 shrink-0 flex-col p-4 md:flex">
          <motion.aside
            className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/60 bg-card px-3 py-5 shadow-[0_8px_32px_-8px_color-mix(in_oklch,var(--color-primary)_18%,black_18%)]"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="mb-4 shrink-0 flex items-center gap-2.5 px-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Binary className="size-3.5" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-foreground">
                Growtopia Tools
              </span>
            </div>

            <div className="tools-scroll flex-1 overflow-y-auto space-y-5">
              {toolGroups.map((group) => (
                <div key={group.title} className="space-y-0.5">
                  <p className="px-2 pb-1.5 text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {group.title}
                  </p>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon
                    const isActive = activeTool === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTool(item.id as ToolId)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <ItemIcon
                          className="size-3.5 shrink-0"
                          strokeWidth={isActive ? 2 : 1.6}
                        />
                        <span className="flex-1 text-sm">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="size-3 opacity-70" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.aside>
        </div>

        {/* main content */}
        <motion.main
          className="flex min-w-0 min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <div className="flex min-h-0 flex-1 flex-col p-4 md:pl-0">
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/60 bg-card shadow-[0_8px_32px_-8px_color-mix(in_oklch,var(--color-primary)_18%,black_18%)]">
              {/* panel header */}
              <div className="shrink-0 border-b border-border/60 px-5 py-4 md:px-7 md:py-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-primary uppercase">
                      {meta.eyebrow}
                    </p>
                    <h2 className="text-base font-semibold leading-tight text-foreground">
                      {meta.title}
                    </h2>
                  </div>
                  <p className="ml-auto hidden text-xs text-muted-foreground sm:block">
                    {meta.description}
                  </p>
                </div>
              </div>

              {/* tool panel */}
              <div className={`flex min-h-0 flex-1 flex-col ${activeTool === "editor" ? "overflow-hidden" : "tools-scroll overflow-y-auto"} px-5 py-6 md:px-7 md:py-7`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTool}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className={activeTool === "editor" ? "flex min-h-0 flex-1 flex-col" : "w-full"}
                  >
                    {activeTool === "converter" ? (
                      <ConverterTool />
                    ) : activeTool === "hash" ? (
                      <HashTool />
                    ) : activeTool === "rttex" ? (
                      <RttexTool />
                    ) : activeTool === "resize-image" ? (
                      <ResizeImageTool />
                    ) : (
                      <EditorTool />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  )
}
