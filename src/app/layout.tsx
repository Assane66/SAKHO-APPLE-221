import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Khalil Apple',
  description: 'Une sélection d’iPhone fiables, disponibles au Sénégal.',
  icons: [
    {
      rel: 'icon',
      url: 'https://res.cloudinary.com/dm6yuokre/image/upload/v1773361864/IMG-20260313-WA0005_2_zsrrym.jpg',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <CartProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <WhatsAppFAB />
              </div>
              <Toaster />
            </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
