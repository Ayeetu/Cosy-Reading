import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import MobileMenu from "@/components/mobile-menu"
import ReadLaterButton from "@/components/read-later-button"
import ThemeToggle from "@/components/theme-toggle"

export default async function Header() {
  const session = await auth()

  async function signOutAction() {
    "use server"
    await signOut({ redirectTo: "/sign-in" })
  }

  return (
    <header className="border-border/60 sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/books"
          className="text-foreground text-lg font-semibold tracking-tight"
        >
          Cosy Reading
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/books">Books</Link>
          </Button>


          {session ? (
            <div className="flex items-center gap-2 ml-2">
              <ReadLaterButton />

              <Link href="/dashboard" className="flex items-center gap-2 rounded-full pr-1 hover:opacity-80 transition-opacity">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt="avatar"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold uppercase">
                    {(session.user.name ?? session.user.email ?? "?")[0]}
                  </div>
                )}
                <span className="text-sm font-medium">
                  {session.user.name ?? session.user.email?.split("@")[0]}
                </span>
              </Link>

              <form action={signOutAction}>
                <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Create account</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile — theme toggle always visible + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <MobileMenu
            user={session?.user ?? null}
            signOutAction={signOutAction}
          />
        </div>
      </div>
    </header>
  )
}

