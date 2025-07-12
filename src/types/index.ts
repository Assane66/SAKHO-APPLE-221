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
