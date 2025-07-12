// src/app/admin/products/new/actions.ts
'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({ 
  cloud_name: 'dm6yuokre', 
  api_key: '852868624222375', 
  api_secret: process.env.CLOUDINARY_API_SECRET, // Store your secret in environment variables
  secure: true
});

export async function uploadImage(formData: FormData): Promise<{success: boolean; url?: string; error?: string;}> {
  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                tags: ['product_thumbnail'],
                folder: 'khalil_apple'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            }
        ).end(buffer);
    });

    return { success: true, url: uploadResult.secure_url };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return { success: false, error: 'Failed to upload image.' };
  }
}
