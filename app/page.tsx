import { auth } from "@/lib/auth"
import { signOut } from "@/lib/auth"

// This is a React Server Component — it runs on the server, never in the browser.
// That means we can call auth() directly to read the session from the database.
// No useEffect, no fetch — just an async function.
export default async function Page() {
  // auth() reads the session cookie, looks up the session in the database,
  // and returns the session object (or null if not logged in).
  const session = await auth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      {session ? (
        // User is logged in — session.user comes from the session table in Neon
        <div className="flex flex-col items-center gap-3 text-center">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt="avatar"
              className="h-16 w-16 rounded-full"
            />
          )}
          <p className="text-xl font-semibold">{session.user.name}</p>
          <p className="text-muted-foreground text-sm">{session.user.email}</p>
          <p className="text-muted-foreground font-mono text-xs">id: {session.user.id}</p>

          {/* signOut is also a server action — it clears the session cookie and
              deletes the session row from the database */}
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/sign-in" })
            }}
          >
            <button
              type="submit"
              className="text-destructive text-sm underline underline-offset-4"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        // No session — not logged in
        <div className="text-center">
          <p className="text-muted-foreground mb-2 text-sm">Not signed in.</p>
          <a href="/sign-in" className="text-sm underline underline-offset-4">
            Sign in
          </a>
        </div>
      )}
    </div>
  )
}
