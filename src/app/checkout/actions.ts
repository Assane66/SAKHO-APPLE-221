// src/app/checkout/actions.ts
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  storage: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().positive(),
  thumbnail: z.string().optional(),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, "Le nom doit comporter au moins 2 caractères."),
  customerPhone: z.string().min(9, "Le numéro de téléphone doit comporter au moins 9 chiffres."),
  customerAddress: z.string().min(3, "L'adresse est requise."),
  items: z.array(orderItemSchema).min(1, "Le panier ne peut pas être vide."),
  deliveryMethod: z.string().min(1),
  deliveryCost: z.number().nonnegative().optional(),
});

type OrderInput = z.infer<typeof createOrderSchema>;

interface ActionResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export async function createOrder(inputData: any): Promise<ActionResult> {
  try {
    // 1. Validation de la structure des données transmises avec Zod
    const validatedData = createOrderSchema.parse(inputData);

    // 2. Vérification et recalcul des prix côté serveur contre la base Firestore
    let verifiedSubtotal = 0;
    const verifiedItems = [];

    // Récupérer les promotions actives pour recalculer les réductions
    const promoSnap = await getDocs(
      query(collection(db, 'promotions'), where('endDate', '>', new Date()))
    );
    const activePromos = promoSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    for (const item of validatedData.items) {
      let unitPrice = item.price; // Prix par défaut de secours

      if (item.productId) {
        const prodDoc = await getDoc(doc(db, 'products', item.productId));
        if (prodDoc.exists()) {
          const product = prodDoc.data();
          const variant = (product.variants || []).find((v: any) => v.storage === item.storage);
          if (variant) {
            unitPrice = variant.price;

            // Appliquer les promotions actives
            const matchingPromo = activePromos.find((promo: any) => {
              if (promo.status === 'Inactif') return false;
              if (promo.targetType === 'all') return true;
              if (promo.targetType === 'category' && promo.targetCategories?.includes(product.categoryId)) return true;
              if (promo.targetType === 'products' && promo.targetProducts?.includes(item.productId)) return true;
              if (promo.productId === item.productId) return true;
              return false;
            });

            if (matchingPromo) {
              const discount = Number((matchingPromo as any).discountAmount) || 0;
              if (discount > 0) {
                unitPrice = Math.max(0, unitPrice - discount);
              }
            }
          }
        }
      }

      const itemTotal = unitPrice * item.quantity;
      verifiedSubtotal += itemTotal;

      verifiedItems.push({
        name: item.name,
        storage: item.storage,
        price: unitPrice,
        quantity: item.quantity,
        thumbnail: item.thumbnail || '',
      });
    }

    const verifiedDeliveryCost = validatedData.deliveryMethod.includes('domicile') ? 3000 : 0;
    const verifiedTotal = verifiedSubtotal + verifiedDeliveryCost;

    // 3. Enregistrement sécurisé dans Firestore
    const orderData = {
      customerName: validatedData.customerName,
      customerPhone: validatedData.customerPhone,
      customerAddress: validatedData.customerAddress,
      items: verifiedItems,
      deliveryMethod: validatedData.deliveryMethod,
      subTotal: verifiedSubtotal,
      deliveryCost: verifiedDeliveryCost,
      total: verifiedTotal,
      totalFormatted: `${verifiedTotal.toLocaleString('fr-FR')} CFA`,
      status: 'En attente',
      date: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    return { success: true, orderId: docRef.id };

  } catch (error: any) {
    console.error('Error creating order:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { 
      success: false, 
      error: error.message || 'Une erreur est survenue lors de la création de la commande.' 
    };
  }
}
