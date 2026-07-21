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
  description: 'Boutique premium d\'iPhones au Sénégal avec service d\'échange assisté par IA.',
  icons: [
    {
      rel: 'icon',
      url: 'https://res.cloudinary.com/dm6yuokre/image/upload/v1752163215/IMG-20250710-WA0000-removebg-preview_uunwq2.png',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
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
