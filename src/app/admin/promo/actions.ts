'use server';

import {db} from '@/lib/firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';
import type {Promotion} from '@/types';

interface CreatePromotionInput
  extends Omit<Promotion, 'id' | 'status' | 'createdAt'> {
  endDate: Date;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createPromotion(
  data: CreatePromotionInput
): Promise<ActionResult> {
  try {
    const promoData = {
      ...data,
      status: 'Actif',
      createdAt: serverTimestamp(),
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
