"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { BookMarked, Check, Clock3, LibraryBig, Loader2, Trash2, X } from "lucide-react"
import { addReadLater, removeReadLater } from "@/app/read-later/actions"
import type { ReadLaterBook } from "@/lib/read-later"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BookInput = {
  slug: string
  title: string
  author: string
  coverPath: string
}

type ReadLaterContextValue = {
  items: ReadLaterBook[]
  hydrated: boolean
  open: boolean
  pending: boolean
  openShelf: () => void
  closeShelf: () => void
  toggleShelf: () => void
  isBookSaved: (slug: string) => boolean
  addBook: (book: BookInput, source?: HTMLElement | null) => void
  removeBook: (slug: string, source?: HTMLElement | null) => void
  updateBookProgress: (slug: string, progress: number) => void
}

const ReadLaterContext = createContext<ReadLaterContextValue | null>(null)

export function useReadLaterShelf() {
  const context = useContext(ReadLaterContext)
  if (!context) {
    throw new Error("useReadLaterShelf must be used inside ReadLaterProvider")
  }
  return context
}

export default function ReadLaterProvider({
  children,
  initialItems,
}: {
  children: React.ReactNode
  initialItems: ReadLaterBook[]
}) {
  const [items, setItems] = useState<ReadLaterBook[]>(initialItems)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const shelfTargetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setItems((current) =>
        initialItems.map((item) => {
          const currentItem = current.find((saved) => saved.slug === item.slug)
          if (!currentItem || currentItem.progress <= item.progress) return item

          return {
            ...item,
            progress: currentItem.progress,
            finished: currentItem.finished || currentItem.progress >= 99,
          }
        }),
      )
    })
    return () => cancelAnimationFrame(id)
  }, [initialItems])

  const animateCover = useCallback(
    (source: HTMLElement | null | undefined, book: BookInput, direction: "in" | "out") => {
      const from = source?.getBoundingClientRect()
      const target = direction === "in" ? shelfTargetRef.current?.getBoundingClientRect() : from

      if (!from || !target) return

      const clone = document.createElement("img")
      clone.src = book.coverPath
      clone.alt = ""
      clone.setAttribute("aria-hidden", "true")
      clone.style.position = "fixed"
      clone.style.left = `${from.left}px`
      clone.style.top = `${from.top}px`
      clone.style.width = `${from.width}px`
      clone.style.height = `${from.height}px`
      clone.style.objectFit = "cover"
      clone.style.borderRadius = "8px"
      clone.style.boxShadow = "0 20px 60px rgba(0,0,0,0.28)"
      clone.style.zIndex = "100"
      clone.style.pointerEvents = "none"
      clone.style.transformOrigin = "top left"
      document.body.appendChild(clone)

      const dx = target.left + target.width / 2 - (from.left + from.width / 2)
      const dy = target.top + target.height / 2 - (from.top + from.height / 2)
      const scale = Math.max(0.16, Math.min(0.42, target.width / Math.max(from.width, 1)))
      const duration = direction === "in" ? 820 : 260
      const easing = direction === "in" ? "cubic-bezier(.16,1,.3,1)" : "cubic-bezier(.4,0,1,1)"

      requestAnimationFrame(() => {
        clone.style.transition =
          `transform ${duration}ms ${easing}, opacity ${duration}ms ease, filter ${duration}ms ease`
        clone.style.transform =
          direction === "in"
            ? `translate(${dx}px, ${dy}px) scale(${scale})`
            : "translate(0, 0) scale(0.86)"
        clone.style.opacity = direction === "in" ? "0.18" : "0"
        clone.style.filter = direction === "in" ? "saturate(1.1)" : "saturate(0.85) blur(1px)"
      })

      window.setTimeout(() => clone.remove(), duration + 80)
    },
    [],
  )

  const isBookSaved = useCallback(
    (slug: string) => items.some((item) => item.slug === slug),
    [items],
  )

  const addBook = useCallback(
    (book: BookInput, source?: HTMLElement | null) => {
      setOpen(true)
      window.requestAnimationFrame(() => {
        animateCover(source, book, "in")
      })
      setItems((current) => [
        {
          slug: book.slug,
          title: book.title,
          author: book.author,
          year: new Date().getFullYear(),
          coverPath: book.coverPath,
          progress: 0,
          finished: false,
          addedAt: new Date().toISOString(),
        },
        ...current.filter((item) => item.slug !== book.slug),
      ])

      startTransition(async () => {
        setItems(await addReadLater(book.slug))
      })
    },
    [animateCover],
  )

  const removeBook = useCallback(
    (slug: string, source?: HTMLElement | null) => {
      const item = items.find((saved) => saved.slug === slug)
      if (item) animateCover(source, item, "out")
      setItems((current) => current.filter((saved) => saved.slug !== slug))

      startTransition(async () => {
        setItems(await removeReadLater(slug))
      })
    },
    [animateCover, items],
  )

  const updateBookProgress = useCallback((slug: string, progress: number) => {
    const normalized = Math.max(0, Math.min(100, Math.round(progress)))

    setItems((current) =>
      current.map((item) =>
        item.slug === slug
          ? {
              ...item,
              progress: normalized,
              finished: normalized >= 99,
            }
          : item,
      ),
    )
  }, [])

  const value = useMemo<ReadLaterContextValue>(
    () => ({
      items,
      hydrated: true,
      open,
      pending: isPending,
      openShelf: () => setOpen(true),
      closeShelf: () => setOpen(false),
      toggleShelf: () => setOpen((current) => !current),
      isBookSaved,
      addBook,
      removeBook,
      updateBookProgress,
    }),
    [addBook, isBookSaved, isPending, items, open, removeBook, updateBookProgress],
  )

  return (
    <ReadLaterContext.Provider value={value}>
      {children}
      <ReadLaterDrawer shelfTargetRef={shelfTargetRef} />
    </ReadLaterContext.Provider>
  )
}

function ReadLaterDrawer({
  shelfTargetRef,
}: {
  shelfTargetRef: React.RefObject<HTMLDivElement | null>
}) {
  const { closeShelf, items, open, pending, removeBook } = useReadLaterShelf()

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/35 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeShelf}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out sm:max-w-[28rem]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Read later shelf"
        aria-hidden={!open}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3">
            <div
              ref={shelfTargetRef}
              className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
              <LibraryBig className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Read later</h2>
              <p className="text-xs text-muted-foreground">
                {items.length === 1 ? "1 saved book" : `${items.length} saved books`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close read later" onClick={closeShelf}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <BookMarked className="mb-4 size-10 text-muted-foreground/60" />
              <p className="text-sm font-medium">Your shelf is empty</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Save a book from the catalog or a book page and it will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((book) => (
                <ReadLaterRow
                  key={book.slug}
                  book={book}
                  onOpen={closeShelf}
                  onRemove={(source) => removeBook(book.slug, source)}
                />
              ))}
            </div>
          )}
        </div>

        {pending && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
            <Loader2 className="size-3.5 animate-spin" />
            Syncing shelf
          </div>
        )}
      </aside>
    </>
  )
}

function ReadLaterRow({
  book,
  onOpen,
  onRemove,
}: {
  book: ReadLaterBook
  onOpen: () => void
  onRemove: (source: HTMLElement | null) => void
}) {
  const coverRef = useRef<HTMLAnchorElement>(null)

  return (
    <div className="group flex gap-4 border-b border-border px-5 py-4">
      <Link
        ref={coverRef}
        href={`/books/${book.slug}/read`}
        onClick={onOpen}
        className="relative h-28 w-[4.55rem] shrink-0 overflow-hidden rounded-md bg-muted shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5"
      >
        <Image src={book.coverPath} alt={`Cover of ${book.title}`} fill className="object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <Link href={`/books/${book.slug}/read`} onClick={onOpen} className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug hover:underline">
              {book.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {book.author} · {book.year}
            </p>
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${book.title} from read later`}
            onClick={() => onRemove(coverRef.current)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        <div className="mt-auto flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {book.finished ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  Finished
                </>
              ) : (
                <>
                  <Clock3 className="size-3.5" />
                  {book.progress}% read
                </>
              )}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                book.finished ? "bg-emerald-500" : "bg-primary",
              )}
              style={{ width: `${book.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
