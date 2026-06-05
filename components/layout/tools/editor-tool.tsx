"use client"

import { useCallback, useDeferredValue, useMemo, useRef, useState, memo } from "react"
import { AnimatePresence } from "framer-motion"
import { Download, Search } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"

import {
  decodeItemsDat,
  encodeItemsDat,
  protonHash,
  type ItemEntry,
  type ItemsDat,
} from "@/lib/items-dat-helper"
import { DropZone, saveBlob, StatusBadge, type Status } from "./shared"

// ─── field config ─────────────────────────────────────────────────────────────

// @note field groups for the item editor form
const FIELD_GROUPS: { label: string; fields: (keyof ItemEntry)[] }[] = [
  {
    label: "Identity",
    fields: ["item_id", "name", "editable_type", "item_category", "action_type", "hit_sound_type", "item_kind"],
  },
  {
    label: "Appearance",
    fields: ["texture", "texture_hash", "texture_x", "texture_y", "texture2", "spread_type", "is_stripey_wallpaper", "collision_type"],
  },
  {
    label: "Gameplay",
    fields: ["val1", "val2", "break_hits", "drop_chance", "clothing_type", "rarity", "max_amount", "is_rayman"],
  },
  {
    label: "Audio / Extra",
    fields: ["extra_file", "extra_file_hash", "audio_volume", "extra_options", "extra_options2", "punch_options"],
  },
  {
    label: "Pet",
    fields: ["pet_name", "pet_prefix", "pet_suffix", "pet_ability"],
  },
  {
    label: "Seed / Grow",
    fields: ["seed_base", "seed_overlay", "tree_base", "tree_leaves", "grow_time"],
  },
]

// @note returns true for fields that should be read-only in the editor
function isReadOnly(field: keyof ItemEntry): boolean {
  return field === "data_position_80"
}

function fieldLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── item editor form ─────────────────────────────────────────────────────────

// @note memoized — only re-renders when item reference or onChange changes
const ItemEditorForm = memo(function ItemEditorForm({
  item,
  onChange,
}: {
  item: ItemEntry
  onChange: (updated: ItemEntry) => void
}) {
  const handleChange = (key: keyof ItemEntry, value: string) => {
    const current = item[key]
    // @note preserve number type if original was number
    if (typeof current === "number") {
      onChange({ ...item, [key]: Number(value) })
    } else {
      onChange({ ...item, [key]: value })
    }
  }

  return (
    <div className="space-y-6">
      {FIELD_GROUPS.map((group) => {
        const visible = group.fields.filter((f) => item[f] !== undefined)
        if (visible.length === 0) return null
        return (
          <div key={group.label}>
            <p className="mb-3 text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {group.label}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((field) => {
                const val = item[field]
                const ro = isReadOnly(field)
                // @note seed_color objects rendered as comma string
                const displayVal =
                  val !== null && typeof val === "object"
                    ? Object.values(val).join(",")
                    : String(val ?? "")

                return (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {fieldLabel(field)}
                    </label>
                    <input
                      type="text"
                      readOnly={ro}
                      defaultValue={displayVal}
                      onBlur={(e) => {
                        if (!ro) handleChange(field, e.target.value)
                      }}
                      className={`h-8 rounded-md border border-border/60 bg-muted/30 px-3 font-mono text-xs text-foreground outline-none transition-colors focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary/30 ${
                        ro ? "cursor-default opacity-50" : ""
                      }`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
})

// ─── virtualized item list ────────────────────────────────────────────────────

// @note renders only the visible rows — avoids ~45k DOM nodes for a 15k item list
function VirtualItemList({
  items,
  selectedId,
  editedIds,
  onSelect,
}: {
  items: ItemEntry[]
  selectedId: number | null
  editedIds: Set<number>
  onSelect: (id: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: 8,
  })

  return (
    <div ref={scrollRef} className="tools-scroll flex-1 overflow-y-auto">
      {items.length === 0 ? (
        <p className="px-3 py-4 text-center text-xs text-muted-foreground">No results</p>
      ) : (
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((vItem) => {
            const it = items[vItem.index]
            const isSelected = it.item_id === selectedId
            const isDirty = editedIds.has(it.item_id)
            return (
              <button
                key={it.item_id}
                type="button"
                data-index={vItem.index}
                ref={virtualizer.measureElement}
                onClick={() => onSelect(it.item_id)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vItem.start}px)`,
                }}
                className={`flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <span className="w-8 shrink-0 font-mono text-[0.65rem] text-muted-foreground">
                  {it.item_id}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs">
                  {it.name || <span className="italic text-muted-foreground">unnamed</span>}
                </span>
                {isDirty && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── editor tool ─────────────────────────────────────────────────────────────

export function EditorTool() {
  const [datFile, setDatFile] = useState<ItemsDat | null>(null)
  // @note O(1) lookup index built once at load time
  const [itemIndex, setItemIndex] = useState<Map<number, ItemEntry>>(new Map())
  const [searchRaw, setSearchRaw] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>({ type: "idle" })
  const [loadStatus, setLoadStatus] = useState<Status>({ type: "idle" })
  // @note plain object keyed by item_id — avoids full Map copy on every edit
  const [edits, setEdits] = useState<Record<number, ItemEntry>>({})

  // @note deferred so filtering doesn't block keystrokes
  const search = useDeferredValue(searchRaw)

  const handleFile = useCallback((file: File) => {
    setLoadStatus({ type: "idle" })
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = (e) => {
      try {
        const buf = new Uint8Array(e.target!.result as ArrayBuffer)
        const data = decodeItemsDat(buf)
        // @note build index once — O(n) here, O(1) everywhere else
        const index = new Map<number, ItemEntry>()
        for (const item of data.items) index.set(item.item_id, item)
        setDatFile(data)
        setItemIndex(index)
        setEdits({})
        setSelectedId(data.items[0]?.item_id ?? null)
        setStatus({ type: "idle" })
        setLoadStatus({
          type: "success",
          message: `Loaded ${data.item_count.toLocaleString()} items (v${data.version})`,
        })
      } catch (err) {
        setLoadStatus({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to load file",
        })
      }
    }
  }, [])

  const filteredItems = useMemo(() => {
    if (!datFile) return []
    const q = search.toLowerCase().trim()
    if (!q) return datFile.items
    return datFile.items.filter(
      (it) => it.name.toLowerCase().includes(q) || String(it.item_id).includes(q),
    )
  }, [datFile, search])

  // @note O(1) lookup via index + edits object
  const selectedItem = useMemo(() => {
    if (selectedId === null) return null
    return edits[selectedId] ?? itemIndex.get(selectedId) ?? null
  }, [selectedId, edits, itemIndex])

  // @note set of edited ids for dirty indicator — derived cheaply from edits keys
  const editedIds = useMemo(() => new Set(Object.keys(edits).map(Number)), [edits])

  const handleItemChange = useCallback((updated: ItemEntry) => {
    setEdits((prev) => ({ ...prev, [updated.item_id]: updated }))
  }, [])

  const handleExport = useCallback(() => {
    if (!datFile) return
    setStatus({ type: "idle" })
    try {
      const merged: ItemsDat = {
        ...datFile,
        items: datFile.items.map((it) => edits[it.item_id] ?? it),
      }
      const buf = encodeItemsDat(merged)
      const hash = protonHash(buf)
      saveBlob(buf.buffer as ArrayBuffer, "items.dat")
      setStatus({ type: "success", message: `Exported items.dat — hash: ${hash >>> 0}` })
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Export failed",
      })
    }
  }, [datFile, edits])

  // @note empty state — no file loaded yet
  if (!datFile) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Load a binary{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">items.dat</code>{" "}
          to browse and edit every item field, then export a modified{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">items.dat</code>{" "}
          with the proton hash shown automatically.
        </p>
        <DropZone
          accept="*"
          label="Drop items.dat here"
          sublabel="or click to browse — binary .dat file"
          onFile={handleFile}
        />
        <AnimatePresence>
          <StatusBadge status={loadStatus} />
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* top bar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence>
            <StatusBadge status={loadStatus} />
          </AnimatePresence>
          <AnimatePresence>
            <StatusBadge status={status} />
          </AnimatePresence>
          {Object.keys(edits).length > 0 && (
            <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {Object.keys(edits).length} edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDatFile(null)
              setItemIndex(new Map())
              setEdits({})
              setSelectedId(null)
              setStatus({ type: "idle" })
              setLoadStatus({ type: "idle" })
            }}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Load new file
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="size-3.5" />
            Export .dat
          </button>
        </div>
      </div>

      {/* two-column layout: item list + editor */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* item list */}
        <div className="flex w-48 shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/20 sm:w-56">
          <div className="relative shrink-0 border-b border-border/60 p-2">
            <Search className="absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search…"
              value={searchRaw}
              onChange={(e) => setSearchRaw(e.target.value)}
              className="h-7 w-full rounded-md bg-background pl-7 pr-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <VirtualItemList
            items={filteredItems}
            selectedId={selectedId}
            editedIds={editedIds}
            onSelect={setSelectedId}
          />
        </div>

        {/* field editor */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60">
          {selectedItem ? (
            <div className="tools-scroll flex-1 overflow-y-auto p-5">
              <ItemEditorForm
                key={selectedItem.item_id}
                item={selectedItem}
                onChange={handleItemChange}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">Select an item</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
