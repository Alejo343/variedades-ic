import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

// Body font of the admin panel (`.adm` in globals.css). The public site loads
// its own fonts in `app/(site)/layout.tsx`.
const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IC Variedades',
  description: 'Tecnología, belleza y hogar en un solo lugar. Mira el catálogo y pide por WhatsApp.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${outfit.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  )
}
