import { handlers } from "@/lib/auth"

// This single file handles all Auth.js routes:
//   GET/POST /api/auth/signin
//   GET/POST /api/auth/callback/google
//   GET/POST /api/auth/callback/github
//   GET/POST /api/auth/signout
//   GET      /api/auth/session
//   GET      /api/auth/csrf
export const { GET, POST } = handlers
