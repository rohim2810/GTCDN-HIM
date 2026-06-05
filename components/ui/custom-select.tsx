"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

type CustomSelectOption = {
  label: string
  value: string
}

type CustomSelectProps = {
  id?: string
  value: string
  options: CustomSelectOption[]
  disabled?: boolean
  onValueChange: (value: string) => void
  triggerClassName?: string
  menuClassName?: string
}

export default function CustomSelect({
  id,
  value,
  options,
  disabled = false,
  onValueChange,
  triggerClassName,
  menuClassName,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [open])

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  )

  return (
    <div className="relative" ref={rootRef}>
      <Button
        id={id}
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        className={`w-full justify-between ${triggerClassName ?? ""}`.trim()}
      >
        <span className="truncate">{selectedOption?.label ?? ""}</span>
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className={`absolute right-0 top-full z-20 mt-2 w-full rounded-xl border border-border bg-popover p-1 shadow-lg ${menuClassName ?? ""}`.trim()}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {options.map((option) => (
              <button
                key={option.value || "__empty__"}
                type="button"
                className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                  value === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-popover-foreground hover:bg-muted"
                }`}
                onClick={() => {
                  onValueChange(option.value)
                  setOpen(false)
                }}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value ? <Check className="size-3.5" /> : null}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
