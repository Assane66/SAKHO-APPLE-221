# 🗄️ Cahier des Charges Technique — Base de Données & Règles d'Accès (Sakho Apple)

> **Projet** : Sakho Apple — E-Commerce Premium & Gestion de Stock IMEI / Scanner QR  
> **SGBD** : Google Cloud Firestore (NoSQL Temps Réel)  
> **Format** : Spécifications des Données, Modèles TypeScript, Fonctionnalités & Firestore Security Rules  
> **Version** : 2.0.0  

---

## 📑 Table des Matières

1. [Architecture Globale Cloud Firestore](#1-architecture-globale-cloud-firestore)
2. [Schéma Exhaustif des Collections & Modèles de Données](#2-schéma-exhaustif-des-collections--modèles-de-données)
   - [2.1 Collection `users`](#21-collection-users)
   - [2.2 Collection `products`](#22-collection-products)
   - [2.3 Collection `inventory`](#23-collection-inventory)
   - [2.4 Collection `orders`](#24-collection-orders)
   - [2.5 Collection `exchanges`](#25-collection-exchanges)
   - [2.6 Collection `flashSales`](#26-collection-flashsales)
   - [2.7 Collection `promotions`](#27-collection-promotions)
   - [2.8 Collection `categories`](#28-collection-categories)
   - [2.9 Collection `banners`](#29-collection-banners)
   - [2.10 Collection `settings`](#210-collection-settings)
3. [Fonctionnalités Associées à la Base de Données](#3-fonctionnalités-associées-à-la-base-de-données)
4. [Matrice des Permissions & Droits d'Accès](#4-matrice-des-permissions--droits-daccès)
5. [Règles de Sécurité Officielles (`firestore.rules`)](#5-règles-de-sécurité-officielles-firestorerules)

---

## 1. 🏗️ Architecture Globale Cloud Firestore

La base de données repose sur **Google Cloud Firestore**, une base NoSQL orientée document, fonctionnant en temps réel.

```
Firestore Root
├── 👤 users/              (Comptes utilisateurs & profils administrateurs)
├── 📱 products/           (Catalogue des modèles génériques d'iPhones/iPads/Macs)
├── 📦 inventory/          (Stock physique unitaire suivi individuellement par IMEI)
├── 🛍️ orders/             (Commandes e-commerce & ventes directes en comptoir)
├── 🔄 exchanges/          (Demandes de reprise / Trade-in d'anciens téléphones)
├── ⚡ flashSales/         (Ventes flash chronométrées avec stocks dédiés)
├── 🏷️ promotions/         (Règles et codes de réduction globaux/catégories)
├── 📂 categories/         (Catégories de produits : iPhones, MacBooks, iPads, Accessoires)
├── 🖼️ banners/            (Bannières promotionnelles du carrousel de la page d'accueil)
└── ⚙️ settings/           (Paramètres généraux : WhatsApp, devises, infos boutique)
```

---

## 2. 📊 Schéma Exhaustif des Collections & Modèles de Données

### 2.1 Collection `users`
Stocke les profils des utilisateurs et détermine les rôles d'accès au back-office Admin.

- **Chemin Document** : `/users/{userId}`
- **Rôle principal** : Vérification des privilèges admin via `request.auth.uid`.

```typescript
export interface UserProfile {
  uid: string;            // ID unique Google Auth / Firebase Auth
  email: string;          // Adresse email de l'utilisateur
  displayName?: string;   // Nom complet
  role: 'admin' | 'client'; // Rôle d'accès (définit les droits dans firestore.rules)
  createdAt: any;         // serverTimestamp
  updatedAt?: any;        // serverTimestamp
}
```

---

### 2.2 Collection `products`
Gère le catalogue principal de la boutique Sakho Apple avec déclinaisons par capacités de stockage et état de la batterie.

- **Chemin Document** : `/products/{productId}`

```typescript
export type ProductVariant = {
  storage: string;         // Ex: "128GB", "256GB", "512GB", "1TB"
  price: number;           // Prix en FCFA (ex: 450000)
  isPromo?: boolean;       // Indique si cette variante est en promotion
  promoPrice?: number;     // Prix réduit si promotion active
  originalPrice?: number;  // Prix d'origine barré
};

export type Product = {
  id: string;              // Identifiant unique Firestore
  name: string;            // Ex: "iPhone 15 Pro Max"
  slug: string;            // URL-friendly slug (ex: "iphone-15-pro-max")
  categoryId: string;      // ID de la catégorie associée
  categoryName?: string;   // Nom dénormalisé pour affichage rapide sans jointure
  thumbnail: string;       // URL de l'image principale
  keywords: string[];      // Mots-clés pour recherche rapide
  batteryHealth: string;   // Ex: "100%", "95%+", "Neuf Scellé"
  status: 'active' | 'inactive';
  hasIMEI?: boolean;       // VRAI si les téléphones de ce modèle sont gérés par IMEI
  variants: ProductVariant[]; // Liste des capacités et prix
  sales?: number;          // Compteur de ventes cumulées pour tri par popularité
  createdAt?: any;         // serverTimestamp
  promoEndDate?: any;      // Date de fin de promotion temporaire
};
```

---

### 2.3 Collection `inventory` (Gestion Unitaire par IMEI)
Permet de tracer individuellement chaque téléphone physique en stock grâce à son numéro **IMEI (15 chiffres)**.

- **Chemin Document** : `/inventory/{stockId}`

```typescript
export type StockItem = {
  id: string;              // Identifiant unique Firestore
  productId: string;       // ID du produit dans la collection `products`
  productName: string;     // Ex: "iPhone 13 Pro"
  imei: string;            // Numéro IMEI unique à 15 chiffres
  storage: string;         // Ex: "256GB"
  status: 'disponible' | 'vendu'; // État physique en stock
  addedAt: any;            // Date d'entrée en stock
  soldAt?: any;            // Date de vente de cet IMEI précis
  customerName?: string;   // Nom du client (si vendu en boutique via QR scanner)
  customerPhone?: string;  // Téléphone du client
  finalPrice?: number;     // Prix réel encaissé lors de la vente
};
```

---

### 2.4 Collection `orders`
Contient l'historique de toutes les commandes passées sur le site web ou créées directement en comptoir boutique.

- **Chemin Document** : `/orders/{orderId}`

```typescript
export interface CartItem {
  id: string;              // Identifiant de ligne
  productId: string;       // Référence produit
  name: string;            // Nom du produit
  storage: string;         // Capacité sélectionnée (ex: "256GB")
  price: number;           // Prix unitaire retenu
  quantity: number;        // Quantité commandée
  thumbnail: string;       // Image du produit
  imeiAssigned?: string;   // IMEI spécifique lié si scanné lors de l'expédition
}

export interface Order {
  id?: string;             // Identifiant unique de commande
  customerName: string;    // Nom & Prénom du destinataire
  customerPhone: string;   // Numéro de contact (WhatsApp / Téléphone)
  customerAddress: string; // Adresse ou ville de livraison
  items: CartItem[];       // Liste des articles commandés
  total: number;           // Montant total de la commande en FCFA
  status: 'En attente' | 'En cours' | 'Livrée' | 'Annulée';
  date: any;               // serverTimestamp de la commande
}
```

---

### 2.5 Collection `exchanges` (Programme de Reprise / Trade-in)
Permet aux clients de faire une demande d'échange en ligne de leur ancien iPhone contre un modèle plus récent.

- **Chemin Document** : `/exchanges/{exchangeId}`

```typescript
export interface ExchangeRequest {
  id?: string;                  // ID unique de la demande
  customerName: string;         // Nom du client
  customerPhone: string;        // Téléphone / WhatsApp
  currentDeviceModel: string;   // Ancien appareil (ex: "iPhone 11")
  currentStorage: string;       // Stockage (ex: "64GB")
  batteryHealth: string;        // État de la batterie (ex: "82%")
  deviceCondition: 'Comme neuf' | 'Bon état' | 'Écran rayé' | 'Problème technique';
  desiredProduct: string;       // Appareil souhaité (ex: "iPhone 14 Pro 128GB")
  estimatedTopUp: number;       // Estimation du rajout financier (FCFA)
  status: 'En attente' | 'Accepté' | 'Refusé' | 'Terminé';
  createdAt: any;               // serverTimestamp
}
```

---

### 2.6 Collection `flashSales`
Gère les événements Ventes Flash temporaires avec compte à rebours et stocks dédiés.

- **Chemin Document** : `/flashSales/{flashSaleId}`

```typescript
export type FlashSaleVariant = {
  storage: string;         // Capacité (ex: "128GB")
  originalPrice: number;   // Prix catalogue standard
  discountPrice: number;   // Prix réduit Vente Flash
  initialStock: number;    // Stock mis en vente flash
  sold: number;            // Quantité déjà vendue durant la vente flash
};

export type FlashSale = {
  id: string;              // ID unique
  productName: string;     // Nom du produit en Vente Flash
  slug: string;            // Slug du produit
  thumbnail: string;       // Image d'illustration
  variants: FlashSaleVariant[]; // Liste des déclinaisons en promo
  endDate: any;            // Horodatage de fin de la vente flash (Count Down)
  status: 'Actif' | 'Programmé' | 'Terminé';
  createdAt: any;          // Date de création
};
```

---

### 2.7 Collection `promotions`
Gère les offres promotionnelles globales ou ciblées par catégorie / produit.

- **Chemin Document** : `/promotions/{promoId}`

```typescript
export interface Promotion {
  id: string;
  title: string;                               // Ex: "Promo Tabaski -15 000 FCFA"
  targetType: 'all' | 'category' | 'products'; // Cible de la réduction
  targetCategories?: string[];                // IDs des catégories ciblées
  targetProducts?: string[];                  // IDs des produits ciblés
  discountAmount: number;                      // Montant fixe déduit (en FCFA)
  startDate?: any;                             // Date de début
  endDate: any;                                // Date de fin
  status: 'Actif' | 'Inactif';
  createdAt?: any;
}
```

---

### 2.8 Collection `categories`
Organise le catalogue par catégories d'appareils Apple.

- **Chemin Document** : `/categories/{categoryId}`

```typescript
export interface Category {
  id: string;         // Ex: "iphones", "macbooks", "ipads", "accessoires"
  name: string;       // Nom affiché (ex: "iPhones")
  slug: string;       // Slug d'URL (ex: "iphones")
  description?: string;
  image?: string;     // URL de l'icône / visuel de catégorie
  order?: number;     // Ordre d'affichage
}
```

---

### 2.9 Collection `banners`
Définit les visuels et carrousels d'accueil.

- **Chemin Document** : `/banners/{bannerId}`

```typescript
export interface Banner {
  id: string;
  title: string;       // Titre promotionnel
  subtitle?: string;   // Slogan ou sous-titre
  imageUrl: string;    // Visuel haute résolution
  linkUrl: string;     // Lien de redirection (ex: "/products/iphone-15-pro")
  active: boolean;     // Activation / Désactivation
  order: number;       // Ordre d'apparition
}
```

---

### 2.10 Collection `settings`
Stocke la configuration système globale de la plateforme Sakho Apple.

- **Chemin Document** : `/settings/{settingId}` (ex: `/settings/general`)

```typescript
export interface AppSettings {
  storeName: string;        // "Sakho Apple"
  whatsappNumber: string;   // Numéro WhatsApp direct pour la commande
  phoneNumber: string;      // Téléphone de service client
  address: string;          // Adresse physique de la boutique
  currency: string;         // "FCFA"
  isMaintenance: boolean;   // Mode maintenance
}
```

---

## 3. ⚙️ Fonctionnalités Associées à la Base de Données

| Domaine / Module | Fonctionnalités de la Base de Données |
| :--- | :--- |
| **1. E-Commerce & Catalogue** | • Consultation temps réel des produits avec filtre par catégorie, statut et mots-clés.<br>• Bascule instantanée entre variantes (128GB, 256GB, 512GB, 1TB) avec ajustement dynamique des prix.<br>• Suivi du statut de batterie (`100%`, `Neuf Scellé`). |
| **2. Scanner QR Code & Traçabilité IMEI** | • Recherche instantanée d'un appareil physique dans `inventory` via scan QR/Caméra ou numéro IMEI (15 chiffres).<br>• Vente directe en comptoir : mise à jour automatique du statut de l'IMEI (`disponible` ➔ `vendu`), enregistrement de l'acheteur (`customerName`, `customerPhone`) et date de vente (`soldAt`). |
| **3. Tunnel de Commande (Checkout)** | • Prise de commande fluide sans authentification obligatoire (compte optionnel).<br>• Création directe dans la collection `orders` avec état initial `'En attente'`.<br>• Notification admin temps réel lors d'une nouvelle commande. |
| **4. Reprise d'Appareil (Trade-in)** | • Soumission du formulaire d'échange dans la collection `exchanges`.<br>• Estimation du montant de rajout (Top-up) calculé selon l'état de l'ancien iPhone et l'appareil ciblé. |
| **5. Ventes Flash & Promos** | • Décompte temporel automatique (Count Down) relié à `endDate`.<br>• Décrémentation du stock dédié de la vente flash à chaque achat. |
| **6. Back-Office Admin** | • Dashboard de gestion complète (CRUD) pour les produits, catégories, stocks IMEI, ventes flash, bannières et commandes.<br>• Gestion des droits via la collection `users` (seuls les profils `role: "admin"` ont l'accès d'écriture). |

---

## 4. 🔐 Matrice des Permissions & Droits d'Accès

| Collection Firestore | Lecture (`read`) | Création (`create`) | Modification (`update`) | Suppression (`delete`) |
| :--- | :--- | :--- | :--- | :--- |
| `/users/{userId}` | Uniquement l'utilisateur lui-même | Utilisateur connecté | Utilisateur connecté | Admin |
| `/products/{productId}` | **Public (Tout le monde)** | **Admin uniquement** | **Admin uniquement** | **Admin uniquement** |
| `/inventory/{itemId}` | **Public (Pour vérification)** | **Admin uniquement** | **Admin uniquement** | **Admin uniquement** |
| `/orders/{orderId}` | **Admin uniquement** | **Public (Tout client)** | **Admin uniquement** | **Admin uniquement** |
| `/exchanges/{exchangeId}` | **Admin uniquement** | **Public (Tout client)** | **Admin uniquement** | **Admin uniquement** |
| `/flashSales/{flashId}` | **Public (Tout le monde)** | **Admin uniquement** | **Admin uniquement** | **Admin uniquement** |
| `/promotions/{promoId}` | **Public (Tout le monde)** | **Admin uniquement** | **Admin uniquement** | **Admin uniquement** |
| `/categories/{catId}` | **Public (Tout le monde)** | **Admin uniquement** | **Admin uniquement** | **Admin uniquement** |
| `/banners/{bannerId}` | **Public (Tout le monde)** | **Admin uniquement** | **Admin uniquement** | **Admin uniquement** |
| `/settings/{settingId}` | **Public (Tout le monde)** | **Admin uniquement** | **Admin uniquement** | **Admin uniquement** |

---

## 5. 🛡️ Règles de Sécurité Officielles (`firestore.rules`)

Voici le fichier complet et officiel de règles de sécurité Cloud Firestore du projet **Sakho Apple** :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // === UTILISATEURS ===
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // === PRODUITS ===
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // === VARIANTES DES PRODUITS ===
    match /products/{productId}/variants/{variantId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // === CATEGORIES ===
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // === COMMANDES ===
    match /orders/{orderId} {
      // N'importe qui (même client non authentifié) peut passer commande
      allow create: if true; 
      allow read: if isAdmin();
      allow update, delete: if isAdmin();
    }

    // === DEMANDES D'ÉCHANGE (TRADE-IN) ===
    match /exchanges/{exchangeId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    // === BANNIERES ===
    match /banners/{bannerId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // === PROMOTIONS ===
    match /promotions/{promoId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // === VENTES FLASH ===
    match /flashSales/{flashId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // === INVENTORY (STOCK IMEI) ===
    match /inventory/{itemId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // === PARAMÈTRES DU SITE ===
    match /settings/{settingId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // === FONCTION D'AUTORISATION ADMIN ===
    function isAdmin() {
      // Vérifie si l'utilisateur est connecté et si son profil dans /users/{uid} a le rôle "admin"
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
  }
}
```
