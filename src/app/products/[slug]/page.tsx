// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { Product } from '@/types';
import { ProductDetailsClient } from '@/components/product-details';

// This is now a Server Component
async function getProductData(slug: string): Promise<{ product: Product | null, similarProducts: Product[] }> {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('slug', '==', slug), where('status', '==', 'active'), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return { product: null, similarProducts: [] };
  }

  const productDoc = querySnapshot.docs[0];
  const product = { id: productDoc.id, ...productDoc.data() } as Product;
  
  let similarProducts: Product[] = [];
  if (product.categoryId) {
      const similarQuery = query(
          productsRef,
          where('categoryId', '==', product.categoryId),
          where('status', '==', 'active'),
          where('id', '!=', product.id),
          limit(4)
      );
      const similarSnapshot = await getDocs(similarQuery);
      similarProducts = similarSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }

  return { product, similarProducts };
}

export default async function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const { product, similarProducts } = await getProductData(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailsClient product={product} similarProducts={similarProducts} />;
}
