import type { Metadata } from 'next';
import { Archivo_Black, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const archivo = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ReUseHub — Circular Materials & Salvage Marketplace',
  description: 'Buy and sell reclaimed wood, surplus metal, textiles, furniture, and construction salvage in our circular community marketplace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#8584BD] text-[#1A1A1A]">
        <AuthProvider>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
