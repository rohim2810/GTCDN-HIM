"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, FolderLock, Globe, Shield } from "lucide-react"

import Navbar from "@/components/layout/navbar"
import { authClient } from "@/lib/auth-client"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: FolderLock,
    title: "Private cache hosting",
    description:
      "Host your Growtopia private server cache files on your own CDN. Players download directly from your endpoint without a third-party CDN subscription.",
  },
  {
    icon: Globe,
    title: "Edge delivery via Cloudflare",
    description:
      "Files are served from Cloudflare's global edge network, keeping latency low for players regardless of their region.",
  },
  {
    icon: Shield,
    title: "Keep your cache private",
    description:
      "Your cache stays yours. No public exposure, no vendor lock-in. Built for GTPS developers who need control without a recurring bill.",
  },
]

export default function Page() {
  const { data: session } = authClient.useSession()
  const ctaHref = session ? "/admin" : "/login"
  const ctaLabel = session ? "Manage Files!" : "Get Started!"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <motion.main
        className="mx-auto w-full max-w-6xl flex-1 space-y-20 px-6 py-12"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
      >
        <motion.section
          className="space-y-6"
          variants={{
            hidden: { opacity: 0, y: 18 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            CDN for Growtopia private servers
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            GTCDN lets GTPS developers self-host their cache files on
            Cloudflare&apos;s edge. No subscription, no third-party dependency.
            Just deploy, point your server, and keep your cache private.
          </p>
          <div className="flex gap-3 pt-1">
            <Link href={ctaHref} className={cn(buttonVariants({ size: "lg" }))}>
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.section>

        <motion.section
          className="space-y-1"
          variants={{
            hidden: { opacity: 0, y: 18 },
            show: { opacity: 1, y: 0 },
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                className="flex gap-5 border-b border-border py-5 last:border-0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.24 }}
              >
                <div className="mt-0.5 shrink-0">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </div>
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {feature.title}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.section>
      </motion.main>

      <footer className="mt-auto border-t border-border/80 bg-gradient-to-b from-muted/10 to-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-5 text-sm text-muted-foreground">
          <p className="text-center">
            Made with ❤️ by{" "}
            <a
              href="https://github.com/YoruAkio"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-violet-500 transition-colors hover:text-violet-400 dark:text-violet-400 dark:hover:text-violet-300"
            >
              YoruAkio
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
