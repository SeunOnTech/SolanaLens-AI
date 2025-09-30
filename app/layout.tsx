import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "AI Solana Transaction Explainer",
  description: "Understand your Solana transactions with AI-powered explanations",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Wrapped children with ThemeProvider and Suspense */}
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
