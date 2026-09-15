// src/lib/image-optimizer.ts

/**
 * Optimise dynamiquement les URLs d'images Cloudinary
 * en injectant la compression automatique (WebP/AVIF) et le redimensionnement.
 */
export function getOptimizedImageUrl(url?: string | null, width = 600): string {
  if (!url) return 'https://placehold.co/600x600.png';

  // Si l'image provient de Cloudinary
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Éviter la double injection si déjà transformée
    if (url.includes('f_auto') || url.includes('q_auto')) {
      return url;
    }
    const uploadIndex = url.indexOf('/upload/');
    const prefix = url.slice(0, uploadIndex + 8); // '.../upload/'
    const suffix = url.slice(uploadIndex + 8);
    return `${prefix}f_auto,q_auto,w_${width},c_limit/${suffix}`;
  }

  return url;
}
