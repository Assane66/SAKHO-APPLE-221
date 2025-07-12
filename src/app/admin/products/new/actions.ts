// src/app/admin/products/new/actions.ts
'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials from environment variables
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
    const buffer = Buffer.from(arrayBuffer);
    const dataURI = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary using the preset method, which is more robust for client-side initiated uploads via a server action.
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      upload_preset: 'khalil_apple', // Use the provided upload preset
    });
    
    if (!uploadResult.secure_url) {
        throw new Error("Cloudinary did not return a secure URL.");
    }

    return { success: true, url: uploadResult.secure_url };
  } catch (error) {
    let errorMessage = 'Failed to upload image.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error('Cloudinary upload error:', error);
    return { success: false, error: errorMessage };
  }
}
