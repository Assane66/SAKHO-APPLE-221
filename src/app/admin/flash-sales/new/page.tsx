// src/app/admin/flash-sales/new/page.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FlashSale } from '@/types';
import { addHours, addDays } from 'date-fns';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

export default function NewFlashSalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [productName, setProductName] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [initialStock, setInitialStock] = useState<number | ''>('');
  const [duration, setDuration] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUDINARY_CLOUD_NAME = 'dm6yuokre';
  const CLOUDINARY_UPLOAD_PRESET = 'khalil_apple';


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setThumbnail('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, true);
        
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                setThumbnail(response.secure_url);
                toast({ title: 'Succès', description: 'Image téléversée avec succès.' });
            } else {
                 throw new Error(`Upload failed with status: ${xhr.status}`);
            }
            setIsUploading(false);
        };
        
        xhr.onerror = () => {
             toast({ variant: 'destructive', title: 'Erreur', description: "Le téléversement de l'image a échoué. Veuillez vérifier votre console." });
             console.error('Upload Error:', xhr.statusText);
             setIsUploading(false);
        };

        xhr.send(formData);

    } catch (error) {
        setIsUploading(false);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de téléverser l'image." });
        console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !productName ||
      !thumbnail ||
      !originalPrice ||
      !discountPrice ||
      !initialStock ||
      !duration
    ) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
        const now = new Date();
        let endDate: Date;

        switch (duration) {
            case '24h': endDate = addHours(now, 24); break;
            case '48h': endDate = addHours(now, 48); break;
            case '72h': endDate = addHours(now, 72); break;
            case '7j': endDate = addDays(now, 7); break;
            case '30j': endDate = addDays(now, 30); break;
            default: throw new Error('Durée invalide');
        }

        const slug = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const saleData: Omit<FlashSale, 'id'> = {
            productName,
            slug,
            thumbnail,
            originalPrice: Number(originalPrice),
            discountPrice: Number(discountPrice),
            initialStock: Number(initialStock),
            sold: 0,
            status: 'Actif',
            createdAt: serverTimestamp(),
            endDate,
        };

      await addDoc(collection(db, 'flashSales'), saleData);
      toast({title: 'Succès', description: 'La vente flash a été créée.'});
      router.push('/admin/flash-sales');
      
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de créer la vente flash.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
       <div>
        <Button variant="outline" asChild>
          <Link href="/admin/flash-sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Créer une nouvelle vente flash</CardTitle>
          <CardDescription>Configurez les détails de votre vente à durée limitée.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="productName">Nom du produit</Label>
                    <Input
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Ex: Coque en silicone pour iPhone 15"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Image du produit</Label>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Téléversement...' : 'Choisir une image'}
                    </Button>
                    {isUploading && <Progress value={uploadProgress} className="mt-2 w-full" />}
                    {thumbnail && (
                        <div className="mt-4 aspect-square relative w-40 mx-auto overflow-hidden rounded-md border">
                            <Image src={thumbnail} alt="Aperçu du produit" fill className="object-cover" />
                        </div>
                    )}
                </div>
            
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="originalPrice">Prix original (CFA)</Label>
                        <Input
                            id="originalPrice"
                            type="number"
                            value={originalPrice}
                            onChange={e => setOriginalPrice(Number(e.target.value))}
                            placeholder="Prix avant la promotion"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discountPrice">Prix promotionnel (CFA)</Label>
                        <Input
                            id="discountPrice"
                            type="number"
                            value={discountPrice}
                            onChange={e => setDiscountPrice(Number(e.target.value))}
                            placeholder="Nouveau prix"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="initialStock">Stock initial</Label>
                        <Input
                            id="initialStock"
                            type="number"
                            value={initialStock}
                            onChange={e => setInitialStock(Number(e.target.value))}
                            placeholder="Quantité"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Durée de la vente</Label>
                        <Select
                            value={duration}
                            onValueChange={setDuration}
                        >
                            <SelectTrigger id="duration">
                            <SelectValue placeholder="Choisir une durée" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">24 heures</SelectItem>
                                <SelectItem value="48h">48 heures</SelectItem>
                                <SelectItem value="72h">72 heures</SelectItem>
                                <SelectItem value="7j">7 jours</SelectItem>
                                <SelectItem value="30j">30 jours</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
                  {(isSubmitting || isUploading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Enregistrement..." : isUploading ? "En attente de l'image..." : "Enregistrer la vente flash"}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
