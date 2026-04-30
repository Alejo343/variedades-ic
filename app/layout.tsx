import type { Metadata } from 'next'
import { Outfit, Orbitron } from 'next/font/google'
import './globals.css'
import { FontProvider } from './context/FontContext'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
})

const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IC Variedades',
  description: 'Tu tienda de tecnología, belleza y hogar. Gadgets, cuidado personal y más.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-slate-100">
        <FontProvider>{children}</FontProvider>
      </body>
    </html>
  )
}
