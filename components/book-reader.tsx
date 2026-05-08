"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react"
import { getReadingProgress, saveReadingProgress } from "@/app/books/[book]/read/actions"

// ─── Types ───────────────────────────────────────────────────────────────────

type ReaderTheme = { name: string; bg: string; text: string; border: string }

type ReaderSettings = {
  theme: ReaderTheme
  font: string
  fontSize: number
  lineHeight: number
  themeSetByUser: boolean
}

type TocItem = { id: string; href: string; label: string; subitems?: TocItem[] }

// ─── Presets ─────────────────────────────────────────────────────────────────

const THEMES: ReaderTheme[] = [
  { name: "White", bg: "#fafaf9", text: "#1c1917", border: "#e7e5e4" },
  { name: "Sepia", bg: "#f5eedf", text: "#433622", border: "#c9b89a" },
  { name: "Dark",  bg: "#141412", text: "#ffffff", border: "#333330" },
]

const FONTS = [
  { label: "Atkinson",     value: "'Atkinson Hyperlegible', sans-serif" },
  { label: "Bookerly",     value: "Bookerly, 'Book Antiqua', Palatino, 'Palatino Linotype', serif" },
  { label: "Baskerville",  value: "'Libre Baskerville', Baskerville, 'Baskerville Old Face', serif" },
  { label: "Georgia",      value: "Georgia, serif" },
  { label: "Inter",        value: "'Inter', sans-serif" },
  { label: "OpenDyslexic", value: "'OpenDyslexic', sans-serif" },
]

const LINE_HEIGHTS = [1.4, 1.6, 1.8, 2.0]

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500&display=swap"

const OPEN_DYSLEXIC_URL = "https://fonts.cdnfonts.com/css/opendyslexic"

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: THEMES[0],
  font: FONTS[0].value, // Atkinson Hyperlegible
  fontSize: 18,
  lineHeight: 1.8,
  themeSetByUser: false,
}

const STORAGE_KEY = "cosy-reader-settings"

/** CSS injected into every epub iframe to override the epub's own styles. */
function buildRfoCSS(s: ReaderSettings): string {
  const { font, theme, fontSize, lineHeight } = s
  return [
    `html, body { background-color: ${theme.bg} !important; }`,
    `html { font-size: ${fontSize}px !important; line-height: ${lineHeight} !important; }`,
    `body, p, li, blockquote, section, article, h1, h2, h3, h4, h5, h6, td, th {`,
    `  font-family: ${font} !important;`,
    `  color: ${theme.text} !important;`,
    `}`,
  ].join("\n")
}

function detectDarkMode(): boolean {
  try {
    const siteTheme = localStorage.getItem("theme") // stored by next-themes
    return (
      siteTheme === "dark" ||
      ((!siteTheme || siteTheme === "system") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    )
  } catch {}
  return false
}

function loadSettings(): ReaderSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ReaderSettings
      // If the user never explicitly picked a reader theme, re-detect from site/OS
      if (!parsed.themeSetByUser) {
        return { ...parsed, theme: detectDarkMode() ? THEMES[2] : THEMES[0], themeSetByUser: false }
      }
      return parsed
    }
  } catch {}
  // No saved settings at all — detect from site/OS
  return { ...DEFAULT_SETTINGS, theme: detectDarkMode() ? THEMES[2] : THEMES[0] }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookReader({ slug, title }: { slug: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)
  const settingsRef = useRef<ReaderSettings>(DEFAULT_SETTINGS)
  const [progress, setProgress] = useState(0)
  const [pageNum, setPageNum] = useState<{ page: number; total: number } | null>(null)
  const [locationsReady, setLocationsReady] = useState(false)
  const [currentHref, setCurrentHref] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [chapters, setChapters] = useState<TocItem[]>([])
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [showTutorial, setShowTutorial] = useState(false)

  // Derive the current chapter label from the TOC using currentHref
  const currentChapterLabel = currentHref
    ? findChapterLabel(chapters, currentHref)
    : null

  // Load settings from localStorage on mount (client only)
  useEffect(() => {
    setSettings(loadSettings())
    // Show tutorial on first visit
    try {
      if (!localStorage.getItem("cosy-reader-tutorial-seen")) setShowTutorial(true)
    } catch {}
  }, [])

  // Persist settings whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch {}
  }, [settings])

  // ── Initialise epubjs once ─────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let destroyed = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let book: any = null
    let removeResize = () => {}

    const init = async () => {
      const { default: ePub } = await import("epubjs")
      if (destroyed) return

      // Read real pixel dimensions at mount time — never pass "100%" strings
      // because epubjs creates the iframe before the browser resolves percentages
      const w = container.offsetWidth  || 800
      const h = container.offsetHeight || 600

      book = ePub(`/books/${slug}.epub`)
      bookRef.current = book

      const rendition = book.renderTo(container, {
        width:  w,
        height: h,
        // paginated: each screen is exactly one page; no vertical scrolling.
        // epubjs uses CSS columns internally. Image overflow fix (max-width: 100%)
        // prevents ghost columns from appearing.
        manager: "default",
        flow:    "paginated",
        spread:  "none",
      })
      renditionRef.current = rendition

      // Inject Google Fonts + safe image sizing into every chapter iframe
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rendition.hooks.content.register((contents: any) => {
        const doc = contents.document as Document

        // Google Fonts: Atkinson Hyperlegible, Libre Baskerville, Inter
        const gLink = doc.createElement("link")
        gLink.rel = "stylesheet"
        gLink.href = GOOGLE_FONTS_URL
        doc.head.appendChild(gLink)

        // OpenDyslexic (separate CDN)
        const odLink = doc.createElement("link")
        odLink.rel = "stylesheet"
        odLink.href = OPEN_DYSLEXIC_URL
        doc.head.appendChild(odLink)

        const style = doc.createElement("style")
        style.textContent = `
          img, svg, figure, table {
            max-width: 100% !important;
            height: auto !important;
            object-fit: contain !important;
          }
        `
        doc.head.appendChild(style)
      })

      // Track location for progress bar, page numbers, and current chapter
      // "locationChanged" gives {index, href, start: cfiString, end: cfiString}
      // "relocated" gives {start: {cfi, displayed: {page, total}, percentage}, end: ...}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rendition.on("locationChanged", (loc: any) => {
        if (loc?.href) setCurrentHref(loc.href)
        if (bookRef.current?.locations?.percentageFromCfi) {
          const cfi = loc?.start ?? ""
          const pct = bookRef.current.locations.percentageFromCfi(cfi)
          if (typeof pct === "number") setProgress(Math.round(pct * 100))
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rendition.on("relocated", (loc: any) => {
        const displayed = loc?.start?.displayed
        if (displayed?.page) {
          setPageNum({ page: displayed.page, total: displayed.total ?? displayed.page })
        }
        // Also update % here in case locationChanged didn't fire
        if (typeof loc?.start?.percentage === "number") {
          setProgress(Math.round(loc.start.percentage * 100))
        }
        // Auto-save position: localStorage always, DB when logged in
        const cfi = loc?.start?.cfi
        if (cfi) {
          const pct = typeof loc?.start?.percentage === "number" ? loc.start.percentage : 0
          const posKey = `cosy-reader-pos-${slug}`
          try { localStorage.setItem(posKey, JSON.stringify({ cfi, percentage: pct })) } catch {}
          saveReadingProgress(slug, cfi, pct).catch(() => {})
        }
      })

      // After each chapter loads, epub-view has overflow:hidden and a fixed height
      // equal to the container — this clips long chapters.
      const applyFont = () => {
        const iframe = container.querySelector("iframe") as HTMLIFrameElement | null
        if (!iframe?.contentDocument) return
        const doc = iframe.contentDocument
        let el = doc.getElementById("rfo") as HTMLStyleElement | null
        if (!el) {
          el = doc.createElement("style") as HTMLStyleElement
          el.id = "rfo"
          doc.head?.appendChild(el)
        }
        el.textContent = buildRfoCSS(settingsRef.current)
      }

      rendition.on("rendered", applyFont)

      // Restore saved position: DB for logged-in users, localStorage otherwise
      let startCfi: string | null = null
      try {
        const dbPos = await getReadingProgress(slug)
        if (dbPos?.cfi) {
          startCfi = dbPos.cfi
        } else {
          const localRaw = localStorage.getItem(`cosy-reader-pos-${slug}`)
          if (localRaw) startCfi = (JSON.parse(localRaw) as { cfi: string }).cfi
        }
      } catch {}

      await (startCfi ? rendition.display(startCfi) : rendition.display())

      await book.ready
      // Load table of contents
      const toc: TocItem[] = (book.navigation?.toc ?? []) as TocItem[]
      if (!destroyed) setChapters(toc)

      // Generate locations for global % — async, non-blocking
      book.locations.generate(1600).then(() => {
        if (!destroyed) setLocationsReady(true)
      })

      // On window resize: update width but let rendered event handle height
      const onResize = () => {
        const newW = container.offsetWidth || 800
        const newH = container.offsetHeight || 600
        renditionRef.current?.resize(newW, newH)
      }
      window.addEventListener("resize", onResize)
      removeResize = () => window.removeEventListener("resize", onResize)
    }

    init().catch(console.error)

    return () => {
      destroyed = true
      removeResize()
      book?.destroy()
      renditionRef.current = null
      bookRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // ── Apply settings live whenever they change ────────────────────────────────
  useEffect(() => {
    settingsRef.current = settings
    const r = renditionRef.current
    if (!r) return
    r.themes.override("background-color", settings.theme.bg)
    r.themes.override("color",            settings.theme.text)
    r.themes.override("font-size",        `${settings.fontSize}px`)
    r.themes.override("line-height",      String(settings.lineHeight))
    // Inject font with !important directly — themes.override can't beat epub CSS specificity
    const iframe = containerRef.current?.querySelector("iframe") as HTMLIFrameElement | null
    if (iframe?.contentDocument) {
      let el = iframe.contentDocument.getElementById("rfo") as HTMLStyleElement | null
      if (!el) {
        el = iframe.contentDocument.createElement("style") as HTMLStyleElement
        el.id = "rfo"
        iframe.contentDocument.head?.appendChild(el)
      }
      el.textContent = buildRfoCSS(settings)
    }
    // When fontSize changes, the container's maxWidth changes → resize epubjs to match
    const c = containerRef.current
    if (c) r.resize(c.offsetWidth, c.offsetHeight)
  }, [settings])

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") renditionRef.current?.next()
      if (e.key === "ArrowLeft"  || e.key === "PageUp")   renditionRef.current?.prev()
      if (e.key === "Escape") { setSettingsOpen(false); setChaptersOpen(false) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const patch = useCallback(<K extends keyof ReaderSettings>(key: K, val: ReaderSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: val })), [])

  // Theme changes are explicit — mark themeSetByUser so auto-detection won't override
  const patchTheme = useCallback((t: ReaderTheme) =>
    setSettings((s) => ({ ...s, theme: t, themeSetByUser: true })), [])

  const dismissTutorial = useCallback(() => {
    setShowTutorial(false)
    try { localStorage.setItem("cosy-reader-tutorial-seen", "1") } catch {}
  }, [])

  const { theme } = settings

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <header
        className="flex h-12 shrink-0 items-center justify-between gap-4 border-b px-4"
        style={{ borderColor: theme.border }}
      >
        <Link
          href={`/books/${slug}`}
          className="flex min-w-0 items-center gap-1.5 text-sm opacity-60 transition-opacity hover:opacity-100"
          style={{ color: theme.text }}
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="hidden truncate sm:block">{title}</span>
          <span className="sm:hidden">Back</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setChaptersOpen((o) => !o)}
            aria-label="Table of contents"
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all duration-150"
            style={{
              color: theme.text,
              borderColor: chaptersOpen ? theme.text : theme.border,
              backgroundColor: chaptersOpen ? `${theme.text}22` : "transparent",
            }}
          >
            <BookOpen className="size-3.5" />
            <span className="hidden sm:inline">Contents</span>
          </button>
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label="Reader settings"
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150"
            style={{
              color: theme.text,
              borderColor: settingsOpen ? theme.text : theme.border,
              backgroundColor: settingsOpen ? `${theme.text}22` : "transparent",
            }}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Aa</span>
          </button>
        </div>
      </header>

      {/* ── EPUB content ─────────────────────────────────────────────── */}
      {/* Outer wrapper: full-width, holds click zones + centered epub area */}
      <div
        className="relative min-h-0 flex-1 overflow-hidden flex items-stretch justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        {/* Click zones span the full width so margins are also tappable */}
        <div
          className="absolute inset-y-0 left-0 z-[5] w-[22%] cursor-pointer"
          onClick={() => renditionRef.current?.prev()}
          aria-label="Previous page"
        />
        <div
          className="absolute inset-y-0 right-0 z-[5] w-[22%] cursor-pointer"
          onClick={() => renditionRef.current?.next()}
          aria-label="Next page"
        />
        {/* Constrained epub container — epubjs renders into this narrower div.
            maxWidth locks the column to ~65ch so line length stays optimal
            regardless of viewport width. */}
        <div
          ref={containerRef}
          className="relative h-full overflow-hidden"
          style={{ width: "100%", maxWidth: `${Math.round(65 * settings.fontSize * 0.52)}px` }}
        />
      </div>

      {/* ── Bottom nav ───────────────────────────────────────────────── */}
      <footer
        className="flex h-12 shrink-0 items-center justify-between border-t px-6"
        style={{ borderColor: theme.border }}
      >
        <button
          onClick={() => renditionRef.current?.prev()}
          className="flex items-center gap-1 text-sm opacity-50 transition-opacity hover:opacity-100"
          style={{ color: theme.text }}
        >
          <ChevronLeft className="size-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex flex-col items-center gap-1">
          <div
            className="h-0.5 w-40 overflow-hidden rounded-full sm:w-64"
            style={{ backgroundColor: theme.border }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: theme.text, opacity: 0.65 }}
            />
          </div>
          <div className="flex items-center gap-2 tabular-nums text-xs font-medium" style={{ color: theme.text, opacity: 0.7 }}>
            {currentChapterLabel && (
              <span className="max-w-[16rem] truncate" style={{ opacity: 0.6 }}>{currentChapterLabel}</span>
            )}
            {currentChapterLabel && pageNum && (
              <span style={{ opacity: 0.3 }}>·</span>
            )}
            {pageNum && (
              <span className="shrink-0">page {pageNum.page} / {pageNum.total}</span>
            )}
            {locationsReady && (
              <span className="shrink-0" style={{ opacity: 0.5 }}>· {progress}%</span>
            )}
          </div>
        </div>

        <button
          onClick={() => renditionRef.current?.next()}
          className="flex items-center gap-1 text-sm opacity-50 transition-opacity hover:opacity-100"
          style={{ color: theme.text }}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-5" />
        </button>
      </footer>

      {/* ── Shared backdrop (settings + chapters) ───────────────────── */}
      <div
        className="absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: settingsOpen || chaptersOpen ? 1 : 0,
          pointerEvents: settingsOpen || chaptersOpen ? "auto" : "none",
        }}
        onClick={() => { setSettingsOpen(false); setChaptersOpen(false) }}
      />

      {/* ── Chapters drawer (slides in from left) ──────────────────── */}
      <div
        className="absolute top-0 left-0 z-20 h-full w-72 overflow-y-auto transition-transform duration-300 ease-in-out sm:w-80"
        style={{
          backgroundColor: theme.bg,
          borderRight: `1px solid ${theme.border}`,
          transform: chaptersOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div
          className="flex h-12 shrink-0 items-center justify-between border-b px-4"
          style={{ borderColor: theme.border }}
        >
          <span className="text-sm font-semibold" style={{ color: theme.text }}>
            Contents
          </span>
          <button
            onClick={() => setChaptersOpen(false)}
            aria-label="Close contents"
            className="rounded p-1 transition-opacity hover:opacity-100"
            style={{ color: theme.text, opacity: 0.6 }}
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex flex-col py-2">
          {chapters.length === 0 && (
            <p className="px-4 py-6 text-xs" style={{ color: theme.text, opacity: 0.5 }}>
              No chapters found.
            </p>
          )}
          {chapters.map((ch, i) => (
            <ChapterItem
              key={ch.id ?? i}
              item={ch}
              theme={theme}
              currentHref={currentHref}
              onNavigate={(href) => {
                renditionRef.current?.display(href)
                setChaptersOpen(false)
              }}
            />
          ))}
        </nav>
      </div>

      {/* ── Settings drawer (slides in from right) ───────────────────── */}
      <div
        className="absolute top-0 right-0 z-20 h-full w-72 overflow-y-auto transition-transform duration-300 ease-in-out sm:w-80"
        style={{
          backgroundColor: theme.bg,
          borderLeft: `1px solid ${theme.border}`,
          transform: settingsOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex h-12 shrink-0 items-center justify-between border-b px-4"
          style={{ borderColor: theme.border }}
        >
          <span className="text-base font-semibold" style={{ color: theme.text }}>
            Reading settings
          </span>
          <button
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
            className="rounded p-1 opacity-50 transition-opacity hover:opacity-100"
            style={{ color: theme.text }}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex flex-col gap-6 p-5">
          <SettingRow label="Theme" textColor={theme.text}>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => patchTheme(t)}
                  className="rounded border px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: t.bg,
                    color: t.text,
                    borderColor: settings.theme.name === t.name ? t.text : t.border,
                    opacity: settings.theme.name === t.name ? 1 : 0.75,
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Font" textColor={theme.text}>
            <div className="flex flex-wrap gap-2">
              {FONTS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => patch("font", f.value)}
                  className="rounded border px-3 py-1 text-xs"
                  style={{
                    fontFamily: f.value,
                    color: theme.text,
                    borderColor: settings.font === f.value ? theme.text : theme.border,
                    opacity: settings.font === f.value ? 1 : 0.7,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Size" textColor={theme.text}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => patch("fontSize", Math.max(12, settings.fontSize - 2))}
                className="flex h-7 w-8 items-center justify-center rounded border text-sm"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                −
              </button>
              <span className="w-12 text-center text-sm tabular-nums" style={{ color: theme.text }}>
                {settings.fontSize}px
              </span>
              <button
                onClick={() => patch("fontSize", Math.min(30, settings.fontSize + 2))}
                className="flex h-7 w-8 items-center justify-center rounded border text-sm"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                +
              </button>
            </div>
          </SettingRow>

          <SettingRow label="Spacing" textColor={theme.text}>
            <div className="flex gap-2">
              {LINE_HEIGHTS.map((lh) => (
                <button
                  key={lh}
                  onClick={() => patch("lineHeight", lh)}
                  className="rounded border px-3 py-1 text-xs"
                  style={{
                    color: theme.text,
                    borderColor: settings.lineHeight === lh ? theme.text : theme.border,
                    opacity: settings.lineHeight === lh ? 1 : 0.7,
                  }}
                >
                  {lh}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>
      </div>

      {/* ── Tutorial overlay (first visit) ───────────────────────────── */}
      {showTutorial && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        >
          <div
            className="flex w-full max-w-sm flex-col gap-5 rounded-xl p-7 shadow-2xl"
            style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
          >
            <div>
              <h2 className="mb-1 text-base font-semibold" style={{ color: theme.text }}>
                Welcome to your book
              </h2>
              <p className="text-xs opacity-50" style={{ color: theme.text }}>
                A quick guide to the reader
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <TutorialItem
                icon={<><ChevronLeft className="size-4 -mr-1 inline-block" /><ChevronRight className="size-4 inline-block" /></>}
                text="Use the Previous / Next buttons at the bottom — or ← → arrow keys — to move between chapters."
                textColor={theme.text}
                borderColor={theme.border}
              />
              <TutorialItem
                icon={<span className="text-sm leading-none">↕</span>}
                text="Scroll within a chapter to read the full content."
                textColor={theme.text}
                borderColor={theme.border}
              />
              <TutorialItem
                icon={<BookOpen className="size-4" />}
                text='Tap "Contents" in the top-left to jump to any chapter directly.'
                textColor={theme.text}
                borderColor={theme.border}
              />
              <TutorialItem
                icon={<SlidersHorizontal className="size-4" />}
                text='Tap "Aa" in the top-right to change the theme, font, size, and spacing.'
                textColor={theme.text}
                borderColor={theme.border}
              />
            </div>

            <button
              onClick={dismissTutorial}
              className="mt-1 w-full rounded-md py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: theme.text, color: theme.bg }}
            >
              Start reading
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SettingRow({
  label,
  textColor,
  children,
}: {
  label: string
  textColor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-16 shrink-0 pt-0.5 text-sm font-semibold uppercase tracking-wider" style={{ color: textColor, opacity: 0.75 }}>
        {label}
      </span>
      {children}
    </div>
  )
}

// Find the label for the chapter matching currentHref (strips any #fragment)
function findChapterLabel(toc: TocItem[], href: string | null): string | null {
  if (!href) return null
  const bare = href.split("#")[0]
  for (const item of toc) {
    if (item.href.split("#")[0] === bare) return item.label.trim()
    if (item.subitems) {
      const found = findChapterLabel(item.subitems, href)
      if (found) return found
    }
  }
  return null
}

function ChapterItem({
  item,
  theme,
  currentHref,
  onNavigate,
  depth = 0,
}: {
  item: TocItem
  theme: ReaderTheme
  currentHref: string | null
  onNavigate: (href: string) => void
  depth?: number
}) {
  const isActive = currentHref != null &&
    item.href.split("#")[0] === currentHref.split("#")[0]
  return (
    <>
      <button
        onClick={() => onNavigate(item.href)}
        className="w-full text-left text-sm transition-all"
        style={{
          color: theme.text,
          opacity: isActive ? 1 : 0.65,
          fontWeight: isActive ? 600 : 400,
          padding: `0.6rem 1rem`,
          paddingLeft: `${1 + depth * 1.25}rem`,
          backgroundColor: isActive ? `${theme.text}14` : "transparent",
          borderLeft: isActive ? `2px solid ${theme.text}` : "2px solid transparent",
        }}
      >
        {item.label.trim()}
      </button>
      {item.subitems?.map((sub, i) => (
        <ChapterItem
          key={sub.id ?? i}
          item={sub}
          theme={theme}
          currentHref={currentHref}
          onNavigate={onNavigate}
          depth={depth + 1}
        />
      ))}
    </>
  )
}

function TutorialItem({
  icon,
  text,
  textColor,
  borderColor,
}: {
  icon: React.ReactNode
  text: string
  textColor: string
  borderColor: string
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border p-3"
      style={{ borderColor }}
    >
      <div className="mt-0.5 shrink-0 opacity-60" style={{ color: textColor }}>
        {icon}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: textColor }}>
        {text}
      </p>
    </div>
  )
}
