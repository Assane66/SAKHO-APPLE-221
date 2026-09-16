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

export async function getTradeInEstimate(input: {
  currentModel: string;
  photoDataUri: string;
  desiredModel: string;
  contactPhone: string;
}): Promise<{ success: boolean; data?: { estimatedValue: string }; error?: string }> {
  try {
    await addDoc(collection(db, 'exchanges'), {
      currentModel: input.currentModel,
      desiredModel: input.desiredModel,
      contactPhone: input.contactPhone,
      status: 'En attente',
      createdAt: serverTimestamp(),
    });

    const modelLower = (input.currentModel || '').toLowerCase();
    let estimate = '120 000 - 180 000 CFA';
    if (modelLower.includes('15 pro max')) estimate = '550 000 - 650 000 CFA';
    else if (modelLower.includes('15 pro')) estimate = '480 000 - 560 000 CFA';
    else if (modelLower.includes('15')) estimate = '380 000 - 450 000 CFA';
    else if (modelLower.includes('14 pro max')) estimate = '420 000 - 490 000 CFA';
    else if (modelLower.includes('14 pro')) estimate = '360 000 - 420 000 CFA';
    else if (modelLower.includes('14')) estimate = '280 000 - 340 000 CFA';
    else if (modelLower.includes('13 pro max')) estimate = '320 000 - 380 000 CFA';
    else if (modelLower.includes('13 pro')) estimate = '280 000 - 330 000 CFA';
    else if (modelLower.includes('13')) estimate = '220 000 - 270 000 CFA';
    else if (modelLower.includes('12 pro max')) estimate = '240 000 - 290 000 CFA';
    else if (modelLower.includes('12')) estimate = '170 000 - 220 000 CFA';
    else if (modelLower.includes('11')) estimate = '130 000 - 170 000 CFA';

    return {
      success: true,
      data: { estimatedValue: estimate },
    };
  } catch (error: any) {
    console.error('Error in getTradeInEstimate:', error);
    return { success: false, error: error.message || 'Erreur lors de l\'estimation' };
  }
}
