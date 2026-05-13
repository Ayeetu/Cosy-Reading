import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { BookOpen, LibraryBig } from "lucide-react"
import { auth } from "@/lib/auth"
import { getReadLaterItems } from "@/lib/read-later"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/sign-in")

  const readLaterItems = await getReadLaterItems()
  const displayName =
    session.user.name ?? session.user.email?.split("@")[0] ?? "Reader"

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Welcome back, {displayName}
          </h1>
        </div>
        <Button asChild>
          <Link href="/books">
            <BookOpen className="size-4" />
            Browse books
          </Link>
        </Button>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Read later</h2>
            <p className="text-sm text-muted-foreground">
              {readLaterItems.length === 1
                ? "1 saved book"
                : `${readLaterItems.length} saved books`}
            </p>
          </div>
        </div>

        {readLaterItems.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {readLaterItems.map((book) => (
              <Link
                key={book.slug}
                href={`/books/${book.slug}/read`}
                className="group flex gap-4 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/40"
              >
                <div className="relative h-28 w-[4.55rem] shrink-0 overflow-hidden rounded-md bg-muted shadow-sm">
                  <Image
                    src={book.coverPath}
                    alt={`Cover of ${book.title}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-2 text-sm leading-snug font-semibold group-hover:underline">
                    {book.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {book.author} · {book.year}
                  </p>
                  <div className="mt-auto flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{book.finished ? "Finished" : "Progress"}</span>
                      <span>{book.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 text-center">
            <LibraryBig className="mb-4 size-10 text-muted-foreground/60" />
            <p className="text-sm font-medium">No saved books yet</p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Save books from the catalog and they will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
