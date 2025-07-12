// src/app/checkout/actions.ts
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { CartItem } from '@/context/CartContext';

interface OrderInput {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  total: number;
}

interface ActionResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export async function createOrder(data: OrderInput): Promise<ActionResult> {
  try {
    if (!data.items || data.items.length === 0) {
      throw new Error("Le panier ne peut pas être vide.");
    }
    
    const orderData = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      items: data.items.map(item => ({
        productId: item.productId,
        name: item.name,
        storage: item.storage,
        quantity: item.quantity,
        price: item.price,
      })),
      total: `${data.total.toLocaleString('fr-FR')} CFA`,
      status: 'En attente',
      date: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    return { success: true, orderId: docRef.id };

  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'Une erreur est survenue lors de la création de la commande.' };
  }
}
