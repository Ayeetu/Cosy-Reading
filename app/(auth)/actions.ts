"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import sql from "@/lib/db"

export async function signInAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email:    formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." }
    }
    throw error
  }
  redirect("/")
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" })
}

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/" })
}

export async function signUpAction(formData: FormData) {
  const name     = (formData.get("name")     as string).trim()
  const email    = (formData.get("email")    as string).trim().toLowerCase()
  const password =  formData.get("password") as string

  if (!email || !password) return { error: "Email and password are required." }
  if (password.length < 8)  return { error: "Password must be at least 8 characters." }

  // Check if email already exists
  const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing) return { error: "An account with that email already exists." }

  const passwordHash = await bcrypt.hash(password, 12)

  await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name || null}, ${email}, ${passwordHash})
  `

  // Immediately sign them in after registration
  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch {
    return { error: "Account created but sign-in failed. Please sign in manually." }
  }

  redirect("/")
}
