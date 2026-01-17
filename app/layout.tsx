import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { PerformanceMonitor } from '@/components/performance-monitor'

export const metadata: Metadata = {
  title: 'Aurora MBTI',
  description: 'MBTI',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="dns-prefetch" href="https://api.qunqin.org" />
        <link rel="preconnect" href="https://api.qunqin.org" crossOrigin="anonymous" />
        <title>Aurora MBTI</title>
      </head>
      <body className={GeistSans.className}>
        <PerformanceMonitor />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
