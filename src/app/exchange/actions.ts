'use server';

import { estimateTradeInValue, EstimateTradeInValueInput, EstimateTradeInValueOutput } from '@/ai/flows/estimate-trade-in-value';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ActionResult {
    success: boolean;
    data?: EstimateTradeInValueOutput;
    error?: string;
}

export async function getTradeInEstimate(input: EstimateTradeInValueInput): Promise<ActionResult> {
  try {
    // 1. Get the estimate from the AI flow
    const result = await estimateTradeInValue(input);

    // 2. Save the request to the 'exchanges' collection in Firestore
    await addDoc(collection(db, 'exchanges'), {
      ...input,
      estimatedValue: result.estimatedValue,
      status: 'En attente', // Initial status
      createdAt: serverTimestamp(),
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error processing trade-in request:', error);
    return { success: false, error: 'An unexpected error occurred while processing your request.' };
  }
}
