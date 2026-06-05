"use client"

import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { DEFAULT_USER_EMAIL } from "@/lib/constants"

export default function LoginPage() {
  const router = useRouter()
  const session = authClient.useSession()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session.data) {
      router.replace("/admin")
    }
  }, [router, session.data])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await authClient.signIn.email({
      email: DEFAULT_USER_EMAIL,
      password,
    })

    if (result.error) {
      setError("Incorrect password.")
      setLoading(false)
      return
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        className="w-full max-w-sm space-y-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <Zap className="size-5" strokeWidth={2.5} />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Sign in to GTCDN
            </h1>
            <p className="text-sm text-muted-foreground">Authenticated access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-foreground"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              readOnly
              value="user"
              className="w-full cursor-default rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground outline-none select-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/50"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </motion.div>
    </main>
  )
}
