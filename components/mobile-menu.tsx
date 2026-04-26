"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  signOutAction: () => Promise<void>
}

export default function MobileMenu({ user, signOutAction }: Props) {
  const [open, setOpen] = useState(false)

  // Close on route change (any click inside the menu)
  function close() {
    setOpen(false)
  }

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* Hamburger / close toggle — only visible on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 top-14 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Slide-down panel */}
      <div
        className={[
          "fixed inset-x-0 top-14 z-50 md:hidden",
          "border-b border-border bg-background",
          "transition-all duration-200 ease-in-out",
          open ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-2 opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
          <Link
            href="/books"
            onClick={close}
            className="flex h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            Books
          </Link>

          <div className="my-2 h-px bg-border" />

          {user ? (
            // Logged in
            <>
              <div className="flex items-center gap-3 px-3 py-2">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase">
                    {(user.name ?? user.email ?? "?")[0]}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  {user.name && (
                    <span className="truncate text-sm font-medium">{user.name}</span>
                  )}
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex h-11 w-full items-center rounded-lg px-3 text-sm font-medium text-destructive hover:bg-muted transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            // Logged out
            <>
              <Link
                href="/sign-in"
                onClick={close}
                className="flex h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={close}
                className="flex h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
