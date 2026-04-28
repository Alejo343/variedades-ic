import type { Metadata } from 'next'
import { Outfit, Orbitron, Playfair_Display, DM_Sans } from 'next/font/google'
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

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
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
      className={`${outfit.variable} ${orbitron.variable} ${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050b18] text-slate-100">
        <FontProvider>{children}</FontProvider>
      </body>
    </html>
  )
}
