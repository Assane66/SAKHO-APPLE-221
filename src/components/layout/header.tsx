// src/components/layout/header.tsx
'use client';

import Link from "next/link";
import { Menu, User, ShoppingCart, QrCode, Search, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { ThemeToggle } from "../theme-toggle";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { QRScanner } from "../admin/qr-scanner";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { normalizeDigits } from "@/lib/phone-utils";

export function Header() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { cart } = useCart();
  const [brand, setBrand] = useState({ name: 'Khalil Apple', logo: 'https://res.cloudinary.com/dm6yuokre/image/upload/v1773361864/IMG-20260313-WA0005_2_zsrrym.jpg' });
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'general')).then((snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setBrand({
        name: data.shopName || 'Khalil Apple',
        logo: data.logoUrl || data.logo || 'https://res.cloudinary.com/dm6yuokre/image/upload/v1773361864/IMG-20260313-WA0005_2_zsrrym.jpg',
      });
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon && (data.faviconUrl || data.logoUrl || data.logo)) {
        favicon.href = data.faviconUrl || data.logoUrl || data.logo;
      }
    }).catch((error) => console.error('Erreur chargement identité boutique:', error));
  }, []);

  return (
    <header className={cn(
      "site-header sticky top-0 z-50 w-full transition-all duration-500",
      isScrolled
        ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-lg shadow-black/10"
        : "bg-background/50 border-b border-transparent"
    )}>
      <div className="public-topline hidden md:flex">
        <div className="container flex items-center justify-between px-4 text-[10px] font-bold uppercase tracking-[.18em]">
          <span>Authenticité vérifiée · Livraison Dakar</span>
          <span>Service client WhatsApp disponible</span>
        </div>
      </div>
      <div className="container flex h-[4.75rem] items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <div className="mr-auto flex items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <Image src={brand.logo} alt={`${brand.name} logo`} width={42} height={42}
              className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="brand-wordmark" translate="no">
              {brand.name}
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex public-search-chip items-center gap-2 px-3 py-2 text-xs">
          <Search className="h-3.5 w-3.5" />
          <span>Explorer la collection</span>
        </div>
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 mr-3">
          {[
            { href: '/products', label: 'Produits' },
            { href: '/exchange', label: 'Échange' },
            { href: '/about', label: 'À Propos' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors duration-200 group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsScannerOpen(true)}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            <QrCode className="h-5 w-5" />
            <span className="sr-only">Scanner un iPhone</span>
          </Button>

          <ThemeToggle />

          <Link href="/cart" passHref>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-pulse-gold">
                  {itemCount}
                </span>
              )}
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Panier</span>
            </Button>
          </Link>
          <Link href="/products" className="hidden sm:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary hover:text-foreground">
            Collection <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <Link href="/admin/login">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <User className="h-5 w-5" />
              <span className="sr-only">Admin Login</span>
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/10 rounded-xl">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-border/50">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col pt-8 space-y-1">
                <div className="mb-6 pb-6 border-b border-border/50">
                  <span className="brand-wordmark">{brand.name}</span>
                </div>
                <div className="public-mobile-rail md:hidden">
                  <Link href="/products">Tout voir</Link>
                  <Link href="/products?sort=price-asc">Petits prix</Link>
                  <Link href="/exchange">Échange</Link>
                  <Link href="/about">Notre histoire</Link>
                </div>
                {[
                  { href: '/', label: 'Accueil' },
                  { href: '/exchange', label: 'Échange' },
                  { href: '/products', label: 'Produits' },
                  { href: '/about', label: 'Qui sommes-nous' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isScannerOpen && (
        <QRScanner
          onClose={() => setIsScannerOpen(false)}
          onScan={async (imei) => {
            setIsScannerOpen(false);
            try {
              const cleanImei = normalizeDigits(imei);
              const q = query(collection(db, 'inventory'), where('imei', '==', cleanImei));
              const snapshot = await getDocs(q);
              if (!snapshot.empty) {
                const stockData = snapshot.docs[0].data();
                const productId = stockData.productId;
                const productSnap = await getDocs(query(collection(db, 'products'), where('__name__', '==', productId)));
                if (!productSnap.empty) {
                  const productData = productSnap.docs[0].data();
                  router.push(`/products/${productData.slug}`);
                  toast({ title: "Produit trouvé !", description: `Redirection vers ${productData.name}` });
                }
              } else {
                toast({ variant: "destructive", title: "Non trouvé", description: `Cet IMEI (${cleanImei || imei}) n'est pas répertorié dans notre stock.` });
              }
            } catch (error) {
              console.error(error);
              toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue lors de la recherche." });
            }
          }}
        />
      )}
    </header>
  );
}
