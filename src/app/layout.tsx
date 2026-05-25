import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// ✅ 1. ფონტის ოპტიმიზაცია (Next.js Font)
// ავტომატურად ამცირებს CLS-ს, ათავსებს ფონტს ლოკალურად და აქრობს ნელი ჩატვირთვას.
const inter = Inter({
  subsets: ['latin', 'cyrillic'], // ქართული დამწერლობა სისტემურ ფონტზე გადავა, რაც სუფთა ჩანს
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Logistics OS',
  description: 'სრულყოფილი ლოჯისტიკის მართვის სისტემა',
  icons: {
    icon: '/favicon.ico', // ✅ ხატულის მხარდაჭერა
  },
  themeColor: '#080812', // ✅ ბრაუზერის ზედა პანელიც მუქი იქნება
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // ✅ 2. ენის შეცვლა (ქართული SEO-სა და აქსესიბილურობისთვის)
    // ✅ 3. Dark Mode კლასის დამატება (Tailwind-ისთვის)
    <html lang="ka" className="dark">
      {/* ✅ 4. გლობალური სტილები: ფონტი, მუქი ფონი, ანტიალიასინგი */}
      <body className={`${inter.variable} font-sans bg-[#080812] text-slate-100 antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
}