// src/types/index.ts

export type ProductVariant = {
  storage: string;
  price: number;
  isPromo?: boolean;
  promoPrice?: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  thumbnail: string;
  keywords: string[];
  batteryHealth: string;
  status: 'active' | 'inactive';
  variants: ProductVariant[];
  createdAt?: any; // To accommodate serverTimestamp
};

export type FlashSale = {
  id: string;
  productName: string;
  slug: string;
  thumbnail: string;
  variantStorage: string;
  originalPrice: number;
  discountPrice: number;
  initialStock: number;
  sold: number;
  endDate: any; // Firestore timestamp
  status: 'Actif' | 'Programmé' | 'Terminé';
  productId: string; // To link back if needed, though product info is duplicated
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
  productId: string;
  productName: string;
  variantStorage: string;
  originalPrice: number;
  discountPrice: number;
  endDate: any; // Firestore timestamp
  status: 'Actif' | 'Inactif';
  createdAt: any;
}
