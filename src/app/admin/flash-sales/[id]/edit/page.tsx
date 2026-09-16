// src/app/admin/flash-sales/[id]/edit/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, UploadCloud, PlusCircle, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FlashSale, FlashSaleVariant } from '@/types';
import { addHours } from 'date-fns';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

export default function EditFlashSalePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [sale, setSale] = useState<FlashSale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [productName, setProductName] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [variants, setVariants] = useState<FlashSaleVariant[]>([{ storage: '', originalPrice: 0, discountPrice: 0, initialStock: 0, sold: 0 }]);
  const [duration, setDuration] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUDINARY_CLOUD_NAME = 'dm6yuokre';
  const CLOUDINARY_UPLOAD_PRESET = 'khalil_apple';
  
  useEffect(() => {
    if (!id) return;
    const fetchSale = async () => {
        try {
            const docRef = doc(db, 'flashSales', id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const saleData = { id: docSnap.id, ...docSnap.data() } as FlashSale;
                setSale(saleData);
                setProductName(saleData.productName);
                setThumbnail(saleData.thumbnail);
                setVariants(saleData.variants);
                // Duration is not stored, so it will be reset on edit. User must re-select if they want to change it.
            } else {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Vente flash non trouvée.'});
                router.push('/admin/flash-sales');
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données.'});
        } finally {
            setIsLoading(false);
        }
    };
    fetchSale();
  }, [id, router, toast]);

  const handleVariantChange = (index: number, field: keyof Omit<FlashSaleVariant, 'sold'>, value: string | number) => {
    const newVariants = [...variants];
    const variant: any = { ...newVariants[index] };
    if (field === 'storage') {
        variant[field] = String(value);
    } else {
        variant[field] = Number(value);
    }
    newVariants[index] = variant;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { storage: '', originalPrice: 0, discountPrice: 0, initialStock: 0, sold: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

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
      variants.some(v => !v.storage || !v.originalPrice || !v.discountPrice || !v.initialStock)
    ) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs, y compris au moins une variante complète.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
        const slug = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const saleUpdateData: Partial<FlashSale> = {
            productName,
            slug,
            thumbnail,
            variants,
        };

        // Only update end date if a new duration is selected
        if(duration) {
            const now = new Date();
            const durationHours = parseInt(duration, 10);
            saleUpdateData.endDate = addHours(now, durationHours);
        }

      const docRef = doc(db, 'flashSales', id as string);
      await updateDoc(docRef, saleUpdateData);
      
      toast({title: 'Succès', description: 'La vente flash a été mise à jour.'});
      router.push('/admin/flash-sales');
      
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de mettre à jour la vente flash.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin" />
        </div>
    );
  }

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

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Modifier la vente flash</CardTitle>
          <CardDescription>Mettez à jour les détails de la vente à durée limitée.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="productName">Nom du produit</Label>
                        <Input
                            id="productName"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Ex: iPhone 15 Pro Max"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Changer la durée (optionnel)</Label>
                        <Select
                            value={duration}
                            onValueChange={setDuration}
                        >
                            <SelectTrigger id="duration">
                            <SelectValue placeholder="Choisir une nouvelle durée" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2">2 heures</SelectItem>
                                <SelectItem value="4">4 heures</SelectItem>
                                <SelectItem value="6">6 heures</SelectItem>
                                <SelectItem value="8">8 heures</SelectItem>
                                <SelectItem value="12">12 heures</SelectItem>
                                <SelectItem value="24">24 heures</SelectItem>
                                <SelectItem value="48">48 heures</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                        {isUploading ? 'Téléversement...' : 'Changer l\'image'}
                    </Button>
                    {isUploading && <Progress value={uploadProgress} className="mt-2 w-full" />}
                    {thumbnail && (
                        <div className="mt-4 aspect-square relative w-40 mx-auto overflow-hidden rounded-md border">
                            <Image src={thumbnail} alt="Aperçu du produit" fill className="object-cover" />
                        </div>
                    )}
                </div>
            
                <div className="space-y-4">
                    <Label>Variantes du produit</Label>
                    {variants.map((variant, index) => (
                        <div key={index} className="flex flex-col md:flex-row items-center gap-2 p-3 border rounded-md">
                            <div className="w-full md:w-auto flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="col-span-2 md:col-span-1">
                                    <Label className="text-xs text-muted-foreground mb-1 block">Stockage</Label>
                                    <Select required value={variant.storage} onValueChange={(value) => handleVariantChange(index, 'storage', value)}>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Stockage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="64GB">64 GB</SelectItem>
                                            <SelectItem value="128GB">128 GB</SelectItem>
                                            <SelectItem value="256GB">256 GB</SelectItem>
                                            <SelectItem value="512GB">512 GB</SelectItem>
                                            <SelectItem value="1TB">1 TB</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                     <Label className="text-xs text-muted-foreground mb-1 block">Prix Original</Label>
                                    <Input
                                        type="number" placeholder="Original (CFA)" required
                                        value={variant.originalPrice || ''}
                                        onChange={(e) => handleVariantChange(index, 'originalPrice', e.target.value)}
                                    />
                                </div>
                                <div>
                                     <Label className="text-xs text-muted-foreground mb-1 block">Prix Promo</Label>
                                    <Input
                                        type="number" placeholder="Promo (CFA)" required
                                        value={variant.discountPrice || ''}
                                        onChange={(e) => handleVariantChange(index, 'discountPrice', e.target.value)}
                                    />
                                </div>
                                 <div>
                                     <Label className="text-xs text-muted-foreground mb-1 block">Stock</Label>
                                    <Input
                                        type="number" placeholder="Stock" required
                                        value={variant.initialStock || ''}
                                        onChange={(e) => handleVariantChange(index, 'initialStock', e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeVariant(index)} disabled={variants.length === 1} className="mt-2 md:mt-0 ml-auto md:ml-2 self-end">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter une variante
                    </Button>
                </div>

            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
                  {(isSubmitting || isUploading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Enregistrement..." : isUploading ? "En attente de l'image..." : "Mettre à jour la vente flash"}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
