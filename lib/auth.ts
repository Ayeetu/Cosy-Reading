import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { PostgresAdapter } from "./auth-adapter"
import sql from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // Allow signing in with Google even if the email already exists
      // from a different provider (e.g. GitHub or email/password).
      allowDangerousEmailAccountLinking: true,
    }),

    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      // Same — allow linking if this email already exists via another provider.
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const [user] = await sql`
          SELECT id, email, name, image, password_hash
          FROM users
          WHERE email = ${email}
        `

        if (!user || !user.password_hash) return null

        const valid = await bcrypt.compare(password, user.password_hash as string)
        if (!valid) return null

        return {
          id:    user.id    as string,
          email: user.email as string,
          name:  user.name  as string | null,
          image: user.image as string | null,
        }
      },
    }),
  ],

  session: {
    // NextAuth v5 beta: Credentials provider only works with JWT sessions.
    // "database" strategy cannot store Credentials sessions — use "jwt" for
    // both providers so the cookie always works. OAuth user rows are still
    // created in the DB via the adapter; only the session storage differs.
    strategy: "jwt",
  },

  pages: {
    signIn: "/sign-in",
    error:  "/sign-in",   // auth errors redirect back to sign-in with ?error=
  },

  callbacks: {
    // On first sign-in (any provider) persist id and image into the token.
    // name/email are already stored as standard JWT claims automatically.
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id
        token.image = (user as { image?: string | null }).image ?? null
      }
      return token
    },

    // Expose id and image on the session so server components can use them.
    // token.image is set by the jwt callback for Credentials users.
    // token.picture is the standard JWT claim NextAuth auto-fills from
    // user.image for OAuth providers (Google/GitHub) — fall back to it.
    async session({ session, token }) {
      session.user.id    = token.id as string
      session.user.image = (token.image ?? token.picture ?? null) as string | null
      return session
    },
  },
})
