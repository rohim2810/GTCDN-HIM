"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

type ModalContextValue = {
  dismissible: boolean
  onOpenChange: (open: boolean) => void
}

const ModalContext = React.createContext<ModalContextValue | null>(null)

function useModalContext() {
  const context = React.useContext(ModalContext)
  if (!context) {
    throw new Error("Modal components must be used within Modal")
  }

  return context
}

export function Modal({
  open,
  onOpenChange,
  dismissible = true,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dismissible?: boolean
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () => ({ dismissible, onOpenChange }),
    [dismissible, onOpenChange]
  )

  React.useEffect(() => {
    if (!open || !dismissible) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [dismissible, onOpenChange, open])

  return (
    <AnimatePresence>
      {open ? (
        <ModalContext.Provider value={value}>
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismissible && onOpenChange(false)}
          >
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              aria-hidden="true"
            />
            {children}
          </motion.div>
        </ModalContext.Provider>
      ) : null}
    </AnimatePresence>
  )
}

export function ModalContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  useModalContext()

  return (
    <motion.div
      className={cn(
        "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl",
        className
      )}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </motion.div>
  )
}

export function ModalHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    />
  )
}

export function ModalBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("mt-6 space-y-4", className)} {...props} />
}

export function ModalFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex items-center justify-end gap-2", className)}
      {...props}
    />
  )
}

export function ModalTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xl font-semibold text-foreground", className)}
      {...props}
    />
  )
}

export function ModalDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
}
