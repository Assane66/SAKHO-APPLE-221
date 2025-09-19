import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WhatsAppFAB } from '@/components/whatsapp-fab';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Sakho Apple',
  description: 'Premium iPhone Store in Sénégal with AI-powered trade-in.',
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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
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
