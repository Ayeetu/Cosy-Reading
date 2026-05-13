"use server"

import {
  addBookToReadLater,
  removeBookFromReadLater,
} from "@/lib/read-later"

export async function addReadLater(slug: string) {
  return addBookToReadLater(slug)
}

export async function removeReadLater(slug: string) {
  return removeBookFromReadLater(slug)
}
