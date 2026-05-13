import { Geist_Mono, Montserrat } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ReadLaterProvider from "@/components/read-later-shelf"
import { getReadLaterItems } from "@/lib/read-later"

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const readLaterItems = await getReadLaterItems()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", montserrat.variable)}
    >
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          <ReadLaterProvider initialItems={readLaterItems}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ReadLaterProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
