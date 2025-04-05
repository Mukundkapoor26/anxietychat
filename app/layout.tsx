import type { Metadata, Viewport } from 'next'
import './globals.css'
import { JsonLd } from '../components/JsonLd'
import localFont from 'next/font/local'

const handwriting = localFont({
  src: '../public/fonts/Caveat-Regular.woff2',
  variable: '--font-handwriting',
})

export const viewport: Viewport = {
  themeColor: '#4A6741',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'AnxietyChat | Free AI Assistant for Anxiety Support',
  description: 'AnxietyChat offers free AI-powered conversations to help you manage anxiety, stress, and overwhelming thoughts. Talk to our compassionate AI assistant anytime, anywhere.',
  generator: 'Next.js',
  applicationName: 'AnxietyChat',
  referrer: 'origin-when-cross-origin',
  keywords: ['anxiety AI chat', 'free anxiety AI chat', 'anxiety chat AI', 'anxiety helper', 'anxiety support', 'mental health AI', 'stress relief chat', 'overwhelming thoughts', 'AI mental wellness', 'anxiety management'],
  authors: [{ name: 'AnxietyChat Team' }],
  creator: 'AnxietyChat',
  publisher: 'AnxietyChat',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://anxiety-chat.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    }
  },
  openGraph: {
    title: 'AnxietyChat | Free AI Assistant for Anxiety Support',
    description: 'Talk to our compassionate AI assistant anytime for help with anxiety, stress, and overwhelming thoughts. Free, private, and available 24/7.',
    url: 'https://anxiety-chat.com',
    siteName: 'AnxietyChat',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/chat-logo.png',
        width: 800,
        height: 800,
        alt: 'AnxietyChat Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnxietyChat | Free AI Assistant for Anxiety Support',
    description: 'Talk to our compassionate AI assistant anytime for help with anxiety, stress, and overwhelming thoughts. Free, private, and available 24/7.',
    images: ['/twitter-image.png'],
    creator: '@anxietychat',
  },
  icons: {
    icon: [
      { url: '/chat-logo.png' },
      { url: '/chat-logo.png', sizes: '32x32' },
      { url: '/chat-logo.png', sizes: '192x192' },
    ],
    apple: [
      { url: '/chat-logo.png' },
    ],
    shortcut: ['/chat-logo.png'],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={handwriting.variable}>
        {children}
        <JsonLd />
      </body>
    </html>
  )
}
