'use server';

import {db} from '@/lib/firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';
import type {Promotion} from '@/types';
import { addHours, addDays } from 'date-fns';

interface CreatePromotionInput
  extends Omit<Promotion, 'id' | 'status' | 'createdAt' | 'endDate'> {
  duration: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createPromotion(
  data: CreatePromotionInput
): Promise<ActionResult> {
  try {
    const now = new Date();
    let endDate: Date;

    switch (data.duration) {
        case '24h':
            endDate = addHours(now, 24);
            break;
        case '48h':
            endDate = addHours(now, 48);
            break;
        case '72h':
            endDate = addHours(now, 72);
            break;
        case '7j':
            endDate = addDays(now, 7);
            break;
        case '30j':
            endDate = addDays(now, 30);
            break;
        default:
            throw new Error('Durée invalide');
    }

    const promoData = {
      productId: data.productId,
      productName: data.productName,
      variantStorage: data.variantStorage,
      originalPrice: data.originalPrice,
      discountPrice: data.discountPrice,
      status: 'Actif',
      createdAt: serverTimestamp(),
      endDate,
    };
    await addDoc(collection(db, 'promotions'), promoData);
    return {success: true};
  } catch (error) {
    console.error('Error creating promotion:', error);
    if (error instanceof Error) {
      return {success: false, error: `Erreur Firestore: ${error.message}`};
    }
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de la promotion.',
    };
  }
}
