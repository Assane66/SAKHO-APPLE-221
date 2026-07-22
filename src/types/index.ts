// src/types/index.ts

export type ProductVariant = {
  storage: string;
  price: number;
  isPromo?: boolean;
  promoPrice?: number;
  originalPrice?: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName?: string;
  thumbnail: string;
  keywords: string[];
  batteryHealth: string;
  status: 'active' | 'inactive';
  variants: ProductVariant[];
  createdAt?: any; // To accommodate serverTimestamp
  promoEndDate?: any; // To accommodate serverTimestamp
  sales?: number; // Pour le suivi des produits les plus vendus
  hasIMEI?: boolean; // Indique si ce produit peut avoir des exemplaires avec IMEI
};

export type StockItem = {
  id: string;
  productId: string;
  productName: string;
  imei: string;
  storage: string;
  status: 'disponible' | 'vendu';
  addedAt: any;
  soldAt?: any;
  customerName?: string;
  customerPhone?: string;
  finalPrice?: number; // Prix de vente final (peut être différent du prix catalogue)
};

export type FlashSaleVariant = {
  storage: string;
  originalPrice: number;
  discountPrice: number;
  initialStock: number;
  sold: number;
};

export type FlashSale = {
  id: string;
  productName: string;
  slug: string;
  thumbnail: string;
  variants: FlashSaleVariant[];
  endDate: any; // Firestore timestamp
  status: 'Actif' | 'Programmé' | 'Terminé';
  createdAt: any;
};


export interface CartItem {
  id: string;
  productId: string;
  name: string;
  storage: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  total: number;
  status: 'En attente' | 'En cours' | 'Livrée' | 'Annulée';
  date: any; // serverTimestamp
}

export interface Promotion {
  id: string;
  title: string;
  targetType: 'all' | 'category' | 'products';
  targetCategories?: string[];
  targetProducts?: string[];
  discountAmount: number; // Somme déduite (ex: 10 000 CFA)
  startDate?: any;
  endDate: any; // Firestore timestamp
  status: 'Actif' | 'Inactif';
  createdAt?: any;
  // Champs de rétrocompatibilité
  productId?: string;
  productName?: string;
  variantStorage?: string;
  originalPrice?: number;
  discountPrice?: number;
}
