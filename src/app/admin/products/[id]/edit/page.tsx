// src/app/admin/products/[id]/edit/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Trash, PlusCircle, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, collection, onSnapshot, query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, ProductVariant } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [keywords, setKeywords] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([{ storage: '', price: 0 }]);
  const [categories, setCategories] = useState<DocumentData[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUDINARY_CLOUD_NAME = 'dm6yuokre';
  const CLOUDINARY_UPLOAD_PRESET = 'khalil_apple';
  
  useEffect(() => {
    // Fetch categories
    const q = query(collection(db, "categories"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoriesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        categoriesData.push({ id: doc.id, ...doc.data() });
      });
      setCategories(categoriesData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
        try {
            const docRef = doc(db, 'products', id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const productData = { id: docSnap.id, ...docSnap.data() } as Product;
                setProduct(productData);
                setName(productData.name);
                setSlug(productData.slug);
                setStatus(productData.status);
                setCategoryId(productData.categoryId);
                setThumbnail(productData.thumbnail);
                setBatteryHealth(productData.batteryHealth);
                setKeywords(productData.keywords.join(', '));
                setVariants(productData.variants);
            } else {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Produit non trouvé.'});
                router.push('/admin/products');
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données.'});
        } finally {
            setIsLoading(false);
        }
    };
    fetchProduct();
  }, [id, router, toast]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...variants];
    const variant = newVariants[index];
    if (field === 'price') {
        variant[field] = Number(value);
    } else {
        variant[field] = value as string;
    }
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { storage: '', price: 0 }]);
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
    setIsSubmitting(true);

    if (!name || !slug || !categoryId || !thumbnail || variants.some(v => !v.storage || v.price <= 0)) {
        toast({
            variant: 'destructive',
            title: "Erreur de validation",
            description: "Veuillez remplir tous les champs obligatoires.",
        });
        setIsSubmitting(false);
        return;
    }
    
    try {
      const productData = {
        name,
        slug,
        status,
        categoryId,
        thumbnail,
        batteryHealth,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        variants,
      };

      const docRef = doc(db, 'products', id as string);
      await updateDoc(docRef, productData);

      toast({
        title: "Produit mis à jour",
        description: `Le produit "${name}" a été mis à jour avec succès.`,
      });
      router.push('/admin/products');
    } catch (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du produit.",
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
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Modifier le produit</CardTitle>
                    <CardDescription>Mettez à jour les informations du produit.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="product-name">Nom du produit</Label>
                        <Input id="product-name" value={name} onChange={handleNameChange} placeholder="Ex: iPhone 11 Pro Max" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ex: iphone-11-pro-max" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="keywords">Mots-clés</Label>
                        <Textarea id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Séparez les mots-clés par une virgule. Ex: iphone, 11, pro, max" />
                    </div>
                     <div className="space-y-4">
                        <Label>Variantes de stockage et prix</Label>
                        {variants.map((variant, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                            <div className="flex-1 grid grid-cols-2 gap-2">
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
                                <Input
                                    type="number"
                                    placeholder="Prix (CFA)"
                                    required
                                    value={variant.price || ''}
                                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                />
                            </div>
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeVariant(index)} disabled={variants.length === 1}>
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
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Image du produit</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                            <div className="mt-4 aspect-square relative w-full overflow-hidden rounded-md border">
                                <Image src={thumbnail} alt="Aperçu du produit" fill className="object-cover" />
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Organisation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="space-y-2">
                            <Label htmlFor="category">Catégorie</Label>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Sélectionnez une catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="battery-health">Santé de la batterie</Label>
                            <Input id="battery-health" value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} placeholder="Ex: 90-100%" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Statut</Label>
                            <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'inactive')}>
                            <SelectTrigger id="status" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Actif</SelectItem>
                                <SelectItem value="inactive">Inactif</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
         <div className="mt-8 flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting || isUploading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
      </form>
    </div>
  );
}
