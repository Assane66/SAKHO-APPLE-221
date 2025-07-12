// src/types/index.ts

export type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  thumbnail: string;
  keywords: string[];
  batteryHealth: string;
  status: 'active' | 'inactive';
  createdAt?: any; // To accommodate serverTimestamp
};
