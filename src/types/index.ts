// src/types/index.ts

export type ProductVariant = {
  storage: string;
  price: number;
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
