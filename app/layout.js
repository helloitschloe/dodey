import './globals.css'

export const metadata = {
  title: 'Dodey — Agent Kapouk',
  description: 'CRM immobilier intelligent pour Maxime',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
