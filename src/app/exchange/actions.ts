// src/app/exchange/actions.ts
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { z } from 'zod';

const exchangeInputSchema = z.object({
  currentModel: z.string().min(2, "Le modèle actuel est requis."),
  desiredModel: z.string().min(2, "Le modèle souhaité est requis."),
  photoDataUris: z.array(z.string()).min(1, "Au moins une photo est requise."),
  contactPhone: z.string().min(9, "Le numéro de téléphone doit comporter au moins 9 chiffres."),
});

type ExchangeRequestInput = z.infer<typeof exchangeInputSchema>;

interface ActionResult {
    success: boolean;
    data?: { estimatedValue: string };
    error?: string;
}

export async function createExchangeRequest(input: ExchangeRequestInput): Promise<ActionResult> {
  try {
    const validated = exchangeInputSchema.parse(input);
    const uploadedPhotoUrls: string[] = [];

    // Sécurité & Performance: Uploader les photos vers Firebase Storage au lieu de stocker du Base64 dans Firestore
    for (let i = 0; i < validated.photoDataUris.length; i++) {
      const dataUri = validated.photoDataUris[i];
      if (dataUri.startsWith('data:image/')) {
        try {
          const fileName = `exchanges/${Date.now()}_${i}.png`;
          const storageRef = ref(storage, fileName);
          await uploadString(storageRef, dataUri, 'data_url');
          const downloadUrl = await getDownloadURL(storageRef);
          uploadedPhotoUrls.push(downloadUrl);
        } catch (uploadError) {
          console.warn('Fallback: storage upload failed', uploadError);
          uploadedPhotoUrls.push(dataUri.substring(0, 1000));
        }
      } else {
        uploadedPhotoUrls.push(dataUri);
      }
    }

    await addDoc(collection(db, 'exchanges'), {
      currentModel: validated.currentModel,
      desiredModel: validated.desiredModel,
      photoUrls: uploadedPhotoUrls,
      contactPhone: validated.contactPhone,
      status: 'En attente',
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating exchange request:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: 'Une erreur est survenue lors de l\'envoi de votre demande.' };
  }
}

export async function getTradeInEstimate(input: {
  currentModel: string;
  photoDataUri: string;
  desiredModel: string;
  contactPhone: string;
}): Promise<ActionResult> {
  try {
    await createExchangeRequest({
      currentModel: input.currentModel,
      desiredModel: input.desiredModel,
      photoDataUris: [input.photoDataUri],
      contactPhone: input.contactPhone,
    });
    return {
      success: true,
      data: { estimatedValue: 'Estimation personnalisée à venir par WhatsApp / Téléphone' },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur lors de l\'estimation.' };
  }
}
