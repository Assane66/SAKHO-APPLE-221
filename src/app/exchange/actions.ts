import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ExchangeRequestInput {
  currentModel: string;
  desiredModel: string;
  photoUrls: string[];
  contactPhone: string;
}

interface ActionResult {
    success: boolean;
    error?: string;
}

export async function createExchangeRequest(input: ExchangeRequestInput): Promise<ActionResult> {
  try {
    await addDoc(collection(db, 'exchanges'), {
      currentModel: input.currentModel,
      desiredModel: input.desiredModel,
      photoUrls: input.photoUrls,
      contactPhone: input.contactPhone,
      status: 'En attente', // Initial status
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating exchange request:', error);
    if (error instanceof Error) {
        return { success: false, error: `Erreur Firestore: ${error.message}` };
    }
    return { success: false, error: 'Une erreur est survenue lors de l\'envoi de votre demande.' };
  }
}
