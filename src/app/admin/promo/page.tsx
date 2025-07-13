// src/app/admin/promo/page.tsx
'use client';

import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PlusCircle,
  MoreHorizontal,
  Loader2,
  Trash,
} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {db} from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  doc,
  deleteDoc,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {useToast} from '@/hooks/use-toast';
import type {Product, Promotion} from '@/types';
import { addHours, addDays } from 'date-fns';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedVariantStorage, setSelectedVariantStorage] =
    useState<string>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [duration, setDuration] = useState<string>('');

  const {toast} = useToast();

  useEffect(() => {
    const q = query(collection(db, 'promotions'));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const promotionsData: Promotion[] = [];
      querySnapshot.forEach(doc => {
        promotionsData.push({id: doc.id, ...doc.data()} as Promotion);
      });
      setPromotions(promotionsData);
      setIsLoading(false);
    });

    const fetchProducts = async () => {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(
        doc => ({id: doc.id, ...doc.data()} as Product)
      );
      setProducts(productsData);
    };

    fetchProducts();
    return () => unsubscribe();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find(
    v => v.storage === selectedVariantStorage
  );

  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedProduct ||
      !selectedVariant ||
      !discountPrice ||
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
            case '24h':
                endDate = addHours(now, 24);
                break;
            case '48h':
                endDate = addHours(now, 48);
                break;
            case '72h':
                endDate = addHours(now, 72);
                break;
            case '7j':
                endDate = addDays(now, 7);
                break;
            case '30j':
                endDate = addDays(now, 30);
                break;
            default:
                throw new Error('Durée invalide');
        }

        const promoData = {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            variantStorage: selectedVariant.storage,
            originalPrice: selectedVariant.price,
            discountPrice: Number(discountPrice),
            status: 'Actif',
            createdAt: serverTimestamp(),
            endDate,
        };

      await addDoc(collection(db, 'promotions'), promoData);

      toast({title: 'Succès', description: 'La promotion a été ajoutée.'});
      setIsDialogOpen(false);
      // Reset form
      setSelectedProductId('');
      setSelectedVariantStorage('');
      setDiscountPrice('');
      setDuration('');
      
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'ajouter la promotion.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promotions', id));
      toast({title: 'Succès', description: 'Promotion supprimée.'});
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la promotion.',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
          Promotions
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter une promotion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddPromotion}>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle promotion</DialogTitle>
                <DialogDescription>
                  Sélectionnez un produit, une variante, et définissez le prix
                  réduit et la durée.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produit</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={value => {
                      setSelectedProductId(value);
                      setSelectedVariantStorage(''); // Reset variant on product change
                    }}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedProduct && (
                  <div className="space-y-2">
                    <Label htmlFor="variant">Variante (Stockage)</Label>
                    <Select
                      value={selectedVariantStorage}
                      onValueChange={setSelectedVariantStorage}
                    >
                      <SelectTrigger id="variant">
                        <SelectValue placeholder="Sélectionner une variante" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.variants.map(variant => (
                          <SelectItem
                            key={variant.storage}
                            value={variant.storage}
                          >
                            {variant.storage} (
                            {variant.price.toLocaleString('fr-FR')} CFA)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée de la promotion</Label>
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
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Annuler
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des promotions</CardTitle>
          <CardDescription>
            Gérez les offres spéciales et les réductions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>Prix Original</TableHead>
                <TableHead>Prix Réduit</TableHead>
                <TableHead>Date de fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : promotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aucune promotion trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                promotions.map(promo => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">
                      {promo.productName}
                    </TableCell>
                    <TableCell>{promo.variantStorage}</TableCell>
                    <TableCell>
                      {promo.originalPrice?.toLocaleString('fr-FR')} CFA
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {promo.discountPrice.toLocaleString('fr-FR')} CFA
                    </TableCell>
                    <TableCell>
                      {promo.endDate?.seconds
                        ? new Date(
                            promo.endDate.seconds * 1000
                          ).toLocaleString('fr-FR')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          promo.status === 'Actif' ? 'default' : 'outline'
                        }
                      >
                        {promo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(promo.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
