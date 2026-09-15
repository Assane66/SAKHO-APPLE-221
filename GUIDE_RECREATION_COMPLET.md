# 📘 Guide Intégral de Récréation du Projet Sakho Apple

> **Document de Référence Technique & Guide de Déploiement**  
> Ce guide contient toutes les instructions, schémas de base de données, composants d'animation, modales/pop-ups, et le code du scanner QR Code pour reconstruire l'application e-commerce et de gestion de stock IMEI **Sakho Apple** à partir de zéro.

---

## 📑 Table des Matières

1. [🚀 1. Setup & Architecture du Projet](#1--setup--architecture-du-projet)
   - [1.1 Stack Technique](#11-stack-technique)
   - [1.2 Commandes d'Initialisation & Dépendances](#12-commandes-dinitialisation--dépendances)
   - [1.3 Structure des Dossiers & Fichiers](#13-structure-des-dossiers--fichiers)
   - [1.4 Style Global & Configuration Tailwind CSS](#14-style-global--configuration-tailwind-css)
2. [🗄️ 2. Base de Données Cloud Firestore](#2--base-de-données-cloud-firestore)
   - [2.1 Initialisation Firebase SDK](#21-initialisation-firebase-sdk)
   - [2.2 Interfaces TypeScript & Modèles de Données](#22-interfaces-typescript--modèles-de-données)
   - [2.3 Règles de Sécurité Firestore (firestore.rules)](#23-règles-de-sécurité-firestore-firestorerules)
3. [📷 3. Scanner QR Code & Gestion des IMEI](#3--scanner-qr-code--gestion-des-imei)
   - [3.1 Composant Scanner QR (html5-qrcode)](#31-composant-scanner-qr-html5-qrcode)
   - [3.2 Flux de Scan & Recherche en Temps Réel](#32-flux-de-scan--recherche-en-temps-réel)
4. [✨ 4. Animations 3D & Micro-Interactions (Framer Motion)](#4--animations-3d--micro-interactions-framer-motion)
   - [4.1 Bouton Magnétique Lumineux (`MagneticButton.tsx`)](#41-bouton-magnétique-lumineux-magneticbuttontsx)
   - [4.2 Compteur 3D Flip Clock Temps Réel (`FlipClockTimer.tsx`)](#42-compteur-3d-flip-clock-temps-réel-flipclocktimertsx)
   - [4.3 Grille Bento Animée (`BentoGridSection.tsx`)](#43-grille-bento-animée-bentogridsectiontsx)
5. [🪟 5. Pop-Ups, Modales & Tiroirs (UI Dialogs & Sheets)](#5--pop-ups-modales--tiroirs-ui-dialogs--sheets)
   - [5.1 Context du Panier & Tiroir Latéral (`CartContext.tsx` & Sheet)](#51-context-du-panier--tiroir-latéral-cartcontexttsx--sheet)
   - [5.2 Modales de Confirmation & Toasts](#52-modales-de-confirmation--toasts)
6. [🛍️ 6. Fonctionnalités E-Commerce & Back-Office Admin](#6--fonctionnalités-e-commerce--back-office-admin)
   - [6.1 Sélecteur de Déclinaisons / Capacités de Stockage](#61-sélecteur-de-déclinaisons--capacités-de-stockage)
   - [6.2 Commande Instantanée via WhatsApp](#62-commande-instantanée-via-whatsapp)
   - [6.3 Module Échange & Reprise d'Ancien iPhone](#63-module-échange--reprise-dancien-iphone)
   - [6.4 Dashboard Admin & Stock IMEI](#64-dashboard-admin--stock-imei)
7. [🛠️ 7. Procédure de Déploiement de A à Z](#7--procédure-de-déploiement-de-a-à-z)

---

## 🚀 1. Setup & Architecture du Projet

### 1.1 Stack Technique
- **Framework Web** : Next.js 14/15 (App Router, Server & Client Components)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS v3 + CSS Variables
- **UI Components** : Shadcn UI / Radix Primitives
- **Animations** : Framer Motion
- **Icônes** : Lucide React
- **Base de données & Auth** : Firebase Cloud Firestore, Firebase Auth, Storage
- **Scanner QR Code** : `html5-qrcode`

---

### 1.2 Commandes d'Initialisation & Dépendances

Exécutez les commandes suivantes dans votre terminal pour créer le projet et installer toutes les bibliothèques requises :

```bash
# 1. Création du projet Next.js avec TypeScript et Tailwind CSS
npx create-next-app@latest sakho-apple --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Se déplacer dans le dossier
cd sakho-apple

# 3. Installation des dépendances principales
npm install firebase framer-motion html5-qrcode lucide-react clsx tailwind-merge class-variance-authority

# 4. Installation des composants UI Shadcn (Radix primitives)
npm install @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-toast @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-accordion @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tooltip
```

---

### 1.3 Structure des Dossiers & Fichiers

Voici l'arborescence recommandée pour structurer le projet :

```
sakho-apple/
├── public/
│   ├── favicon.ico
│   └── icon.png
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── banners/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── exchanges/page.tsx
│   │   │   ├── flash-sales/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── promo/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── stock/page.tsx
│   │   │   └── layout.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── exchange/page.tsx
│   │   ├── flash-sale/page.tsx
│   │   ├── products/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminTableFilters.tsx
│   │   │   ├── admin-header.tsx
│   │   │   ├── admin-sidebar.tsx
│   │   │   └── qr-scanner.tsx
│   │   ├── home/
│   │   │   ├── BentoGridSection.tsx
│   │   │   ├── FlipClockTimer.tsx
│   │   │   └── MarqueeBanner.tsx
│   │   ├── ui/
│   │   │   ├── MagneticButton.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   └── whatsapp-fab.tsx
│   ├── context/
│   │   ├── AdminNotificationContext.tsx
│   │   ├── AuthContext.tsx
│   │   └── CartContext.tsx
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── firestore.rules
├── firebase.json
└── tailwind.config.ts
```

---

### 1.4 Style Global & Configuration Tailwind CSS

Ajoutez les effets personnalisés (glassmorphism, animations et dégradés) dans `src/app/globals.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 0%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 47.9 95.8% 53.1%; /* Gold Amber */
    --primary-foreground: 26 83.3% 14.1%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 35.5 91.7% 32.9%;
    --radius: 0.75rem;
  }
}

/* Glassmorphism & Micro-animations */
.glass-panel {
  background: rgba(18, 18, 20, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.gold-glow {
  box-shadow: 0 0 25px rgba(245, 158, 11, 0.35);
}
```

---

## 🗄️ 2. Base de Données Cloud Firestore

### 2.1 Initialisation Firebase SDK (`src/lib/firebase.ts`)

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
```

---

### 2.2 Interfaces TypeScript & Modèles de Données (`src/types/index.ts`)

```typescript
// 1. Modèle Produit & Déclinaisons de Capacité
export type ProductVariant = {
  storage: string;        // Ex: "128GB", "256GB", "512GB", "1TB"
  price: number;          // Prix en FCFA (ex: 450000)
  isPromo?: boolean;
  promoPrice?: number;    // Prix réduit
  originalPrice?: number; // Prix barré
};

export type Product = {
  id: string;
  name: string;           // Ex: "iPhone 15 Pro Max"
  slug: string;           // Ex: "iphone-15-pro-max"
  categoryId: string;
  categoryName?: string;
  thumbnail: string;
  keywords: string[];
  batteryHealth: string;  // Ex: "100%", "95%+", "Neuf Scellé"
  status: 'active' | 'inactive';
  hasIMEI?: boolean;      // Requis si suivi unitaire par IMEI
  variants: ProductVariant[];
  createdAt?: any;
  sales?: number;
};

// 2. Modèle Stock Unitaire IMEI (physique en boutique)
export type StockItem = {
  id: string;
  productId: string;
  productName: string;
  imei: string;           // Code 15 chiffres unique
  storage: string;
  status: 'disponible' | 'vendu';
  addedAt: any;
  soldAt?: any;
  customerName?: string;
  customerPhone?: string;
  finalPrice?: number;
};

// 3. Modèle Commande Client
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  storage: string;
  price: number;
  quantity: number;
  thumbnail: string;
  imeiAssigned?: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  total: number;
  status: 'En attente' | 'En cours' | 'Livrée' | 'Annulée';
  date: any;
}

// 4. Modèle Demande de Reprise / Échange (Trade-in)
export interface ExchangeRequest {
  id?: string;
  clientName: string;
  clientPhone: string;
  oldPhoneModel: string;
  batteryState: string;
  cosmeticCondition: string;
  desiredPhoneModel: string;
  estimatedValue?: number;
  status: 'En attente' | 'Approuvé' | 'Rejeté' | 'Terminé';
  createdAt: any;
}
```

---

### 2.3 Règles de Sécurité Firestore (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction de vérification d'authentification admin
    function isAdmin() {
      return request.auth != null;
    }

    // Collection des produits : Lecture publique, écriture admin
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Collection du stock IMEI : Lecture & écriture restreintes aux admins
    match /inventory/{stockId} {
      allow read, write: if isAdmin();
    }

    // Collection des commandes : Écriture ouverte (clients), lecture/update admin
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    // Collection des demandes d'échange : Écriture ouverte, lecture admin
    match /exchanges/{exchangeId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    // Regles par défaut pour les autres collections
    match /{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 📷 3. Scanner QR Code & Gestion des IMEI

### 3.1 Composant Scanner QR (`src/components/admin/qr-scanner.tsx`)

Ce composant utilise la caméra arrière du smartphone/PC ou permet le chargement d'une image contenant le QR Code de l’IMEI :

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Upload, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        videoConstraints: { facingMode: "environment" }
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (err) => {
        // Ignorer les échecs de scan continus
      }
    );

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [onScan]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      onScan(decodedText);
    } catch (err) {
      setError("Impossible de lire le QR code dans cette image.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden text-white shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-amber-400">Scanner un IMEI (QR Code)</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div id="qr-reader" className="w-full bg-black"></div>
        
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Uploader une photo
            </Button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </div>
          
          {error && <p className="text-rose-500 text-sm text-center font-medium">{error}</p>}
          
          <div className="bg-zinc-850 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
            <Camera className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
            <p>Pointez l'objectif vers le QR Code imprimé sur la boîte de l'iPhone ou la fiche de stock.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## ✨ 4. Animations 3D & Micro-Interactions (Framer Motion)

### 4.1 Bouton Magnétique Lumineux (`src/components/ui/MagneticButton.tsx`)

Un bouton physique 3D qui attire la souris lors du survol :

```tsx
'use client';

import React, { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export function MagneticButton({
  children = 'Acheter Maintenant',
  onClick,
  className,
  badge = 'OFFRES 2026',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const position = {
    x: useSpring(0, springConfig),
    y: useSpring(0, springConfig),
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    position.x.set(middleX * 0.35);
    position.y.set(middleY * 0.35);
  };

  const handleMouseLeave = () => {
    position.x.set(0);
    position.y.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block relative p-2"
    >
      <motion.button
        style={{ x: position.x, y: position.y }}
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'group relative inline-flex items-center gap-3 px-8 py-4 text-base font-bold text-black rounded-full overflow-hidden shadow-2xl transition-all duration-300',
          'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:shadow-[0_0_40px_rgba(245,215,142,0.6)]',
          className
        )}
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
        
        <span className="relative z-10 font-bold uppercase tracking-wider text-sm flex items-center gap-2 text-zinc-950">
          {children}
          <ShoppingBag className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </motion.button>
    </div>
  );
}
```

---

### 4.2 Compteur 3D Flip Clock Temps Réel (`src/components/home/FlipClockTimer.tsx`)

Composant d'affichage de compte à rebours sous forme de cartes d'horloge 3D animées lors des Ventes Flash :

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';

interface FlipClockTimerProps {
  targetDate?: Date | number;
  title?: string;
  subtitle?: string;
}

function FlipUnit({ value, unit }: { value: number; unit: string }) {
  const formattedValue = value.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-16 md:w-20 md:h-24 rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-amber-500/30 shadow-2xl flex items-center justify-center overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 z-20" />
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-500/20 z-20" />

        <AnimatePresence mode="popLayout">
          <motion.span
            key={formattedValue}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="font-mono font-extrabold text-2xl md:text-4xl text-amber-400 tracking-wider z-10"
          >
            {formattedValue}
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400">
        {unit}
      </span>
    </div>
  );
}

export function FlipClockTimer({
  targetDate,
  title = 'OFFRE FLASH EXCLUSIVE',
  subtitle = 'Profitez de nos réductions exceptionnelles sur les iPhones certifiés.',
}: FlipClockTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const endTime = targetDate ? new Date(targetDate).getTime() : Date.now() + 24 * 3600 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="relative rounded-3xl p-6 md:p-8 bg-zinc-950 border border-amber-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
      <div className="space-y-2 text-center md:text-left z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold uppercase tracking-widest animate-pulse">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          EXCLU SAKHO APPLE
        </div>
        <h3 className="text-2xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-zinc-400 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 md:gap-5 z-10">
        <FlipUnit value={timeLeft.hours} unit="Heures" />
        <span className="text-2xl font-mono font-bold text-amber-500 pb-6">:</span>
        <FlipUnit value={timeLeft.minutes} unit="Minutes" />
        <span className="text-2xl font-mono font-bold text-amber-500 pb-6">:</span>
        <FlipUnit value={timeLeft.seconds} unit="Secondes" />
      </div>
    </div>
  );
}
```

---

## 🪟 5. Pop-Ups, Modales & Tiroirs (UI Dialogs & Sheets)

### 5.1 Context du Panier & Tiroir Latéral (`src/context/CartContext.tsx`)

```tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  storage: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('sakho_cart');
    if (storedCart) {
      try { setCart(JSON.parse(storedCart)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sakho_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) removeFromCart(itemId);
    else setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
```

---

## 🛍️ 6. Fonctionnalités E-Commerce & Back-Office Admin

### 6.2 Commande Instantanée via WhatsApp

Générez la redirection automatique vers WhatsApp lors de la validation du panier client :

```typescript
export function sendOrderToWhatsApp(customer: { name: string; phone: string; address: string }, items: CartItem[], total: number) {
  const whatsappNumber = "221770000000"; // Numéro de la boutique Sakho Apple
  
  let message = `🛒 *NOUVELLE COMMANDE SAKHO APPLE*\n\n`;
  message += `👤 *Client* : ${customer.name}\n`;
  message += `📞 *Téléphone* : ${customer.phone}\n`;
  message += `📍 *Adresse* : ${customer.address}\n\n`;
  message += `📦 *Articles* :\n`;

  items.forEach(item => {
    message += `• ${item.name} (${item.storage}) x${item.quantity} — ${(item.price * item.quantity).toLocaleString()} FCFA\n`;
  });

  message += `\n💰 *Total à payer* : *${total.toLocaleString()} FCFA*`;

  const encodedUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, '_blank');
}
```

---

## 🛠️ 7. Procédure de Déploiement de A à Z

1. **Variables d'environnement** :
   Créez un fichier `.env.local` à la racine :
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sakho-apple.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=sakho-apple
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sakho-apple.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123def
   ```

2. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

3. **Déploiement sur Firebase Hosting / Vercel** :
   ```bash
   # Build production
   npm run build
   
   # Déploiement Firebase
   npx firebase-tools deploy --only hosting
   ```

---
*Ce document sert de spécification exhaustive pour toute réécriture ou extension de la plateforme Sakho Apple.*
