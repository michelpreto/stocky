import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AlmoxControl',
  description: 'Controle de almoxarifado inteligente',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
