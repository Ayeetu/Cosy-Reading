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
    // "database" strategy stores sessions in the sessions table.
    // "jwt" keeps sessions in a signed cookie — no DB read per request.
    // We use database so sessions can be invalidated server-side.
    strategy: "database",
  },

  pages: {
    signIn: "/sign-in",
    error:  "/sign-in",   // auth errors redirect back to sign-in with ?error=
  },

  callbacks: {
    // Expose the user id on the session object so we can use it in API routes.
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
