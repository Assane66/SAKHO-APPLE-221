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
  subTotal: number;
  deliveryMethod: string;
  deliveryCost: number;
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
    
    // Ensure items are plain objects
    const plainItems = data.items.map(item => ({
      id: item.id,
      name: item.name,
      storage: item.storage,
      quantity: item.quantity,
      price: item.price,
      thumbnail: item.thumbnail
    }));

    const orderData = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      items: plainItems,
      subTotal: data.subTotal,
      deliveryMethod: data.deliveryMethod,
      deliveryCost: data.deliveryCost,
      total: data.total,
      totalFormatted: `${data.total.toLocaleString('fr-FR')} CFA`,
      status: 'En attente',
      date: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    return { success: true, orderId: docRef.id };

  } catch (error) {
    console.error('Error creating order:', error);
    // Check for specific Firestore errors if possible
    if (error instanceof Error && 'code' in error) {
       // This is a generic way to show a more specific error, you might need to adapt it
       return { success: false, error: `Erreur Firestore: ${error.message}` };
    }
    return { success: false, error: 'Une erreur est survenue lors de la création de la commande. Veuillez réessayer.' };
  }
}
