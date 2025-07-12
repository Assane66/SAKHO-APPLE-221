// src/app/admin/products/new/actions.ts
'use server';
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dm6yuokre', 
  api_key: '852868624222375',
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(formData: FormData) {
  const file = formData.get('image') as File;
  if (!file) {
    return { success: false, error: 'No image file found.' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const results = await new Promise((resolve, reject) => {
       cloudinary.uploader.upload_stream(
        {
          folder: "khalil_apple",
          resource_type: "auto"
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject(error);
            return;
          }
          resolve(result);
        }
      ).end(buffer);
    });

    return { success: true, data: results };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Upload failed: ${errorMessage}` };
  }
}
