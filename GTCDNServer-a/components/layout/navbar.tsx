"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { AnimatePresence, motion } from "framer-motion"
import {
  KeyRound,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserCircle2,
  X,
  Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavbarProps {
  adminProfile?: {
    name: string
    email: string
    onChangePassword: () => void
    onSignOut: () => void
  }
}

export default function Navbar({ adminProfile }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!profileOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [profileOpen])

  const theme = mounted && resolvedTheme === "light" ? "light" : "dark"
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>

            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                <Zap className="size-4" strokeWidth={2.5} />
              </div>
              <span className="font-mono text-sm font-semibold tracking-widest uppercase select-none">
                gtcdn
              </span>
            </Link>
          </div>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground"
              )}
            >
              Home
            </Link>
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground"
              )}
            >
              File Manager
            </Link>
            <Link
              href="/tools"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground"
              )}
            >
              Tools
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {adminProfile ? (
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setProfileOpen((open) => !open)}
                  title="Account"
                >
                  <UserCircle2 className="size-4" />
                </Button>

                <AnimatePresence>
                  {profileOpen ? (
                    <motion.div
                      className="absolute top-full right-0 z-30 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-xl"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {adminProfile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {adminProfile.email}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-border pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setProfileOpen(false)
                            adminProfile.onChangePassword()
                          }}
                        >
                          <KeyRound className="size-4" />
                          Change Password
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setProfileOpen(false)
                            adminProfile.onSignOut()
                          }}
                        >
                          <LogOut className="size-4" />
                          Log out
                        </Button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}

            {mounted ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="size-9 text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            ) : (
              <div className="size-9" aria-hidden="true" />
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r bg-background shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md border border-primary/30 bg-primary/15 text-primary">
                    <Zap className="size-3.5" strokeWidth={2.5} />
                  </div>
                  <span className="font-mono text-sm font-semibold tracking-widest uppercase">
                    gtcdn
                  </span>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-start text-sm"
                  )}
                >
                  Home
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-start text-sm"
                  )}
                >
                  File Manager
                </Link>
                <Link
                  href="/tools"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-start text-sm"
                  )}
                >
                  Tools
                </Link>
              </nav>

              <div className="flex items-center justify-between border-t p-4">
                <span className="font-mono text-xs text-muted-foreground">
                  theme
                </span>
                {mounted ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="h-8 gap-2 text-xs"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="size-3.5" />
                        Light
                      </>
                    ) : (
                      <>
                        <Moon className="size-3.5" />
                        Dark
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="h-8 w-20" aria-hidden="true" />
                )}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
