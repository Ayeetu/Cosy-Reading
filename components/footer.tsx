import Link from "next/link"
import { auth } from "@/lib/auth"

export default async function Footer() {
  const session = await auth()

  return (
    <footer className="border-border/60 mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Cosy Reading. All rights reserved.
        </p>

        <nav className="flex items-center gap-4">
          <Link
            href="/books"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Books
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  )
}
