export { auth as proxy } from "@/lib/auth"

export const config = {
  matcher: [
    // Run on all routes except static files, images, and favicon.
    // Auth.js reads the session cookie and makes the user available
    // to server components via auth() — it does NOT redirect by itself.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
