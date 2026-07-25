// src/app/admin/promo/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { AdminTableFilters } from '@/components/admin/AdminTableFilters';
import { useAdminTableFilters, searchInFields, sortByString, sortByNumber, sortByDate } from '@/hooks/use-admin-table-filters';
import { Button } from '@/components/ui/button';
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
  Tag,
  Layers,
  Users,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  doc,
  deleteDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Product, Promotion } from '@/types';
import { addHours, addDays } from 'date-fns';

type Category = { id: string; name: string };

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New form state
  const [title, setTitle] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'category' | 'products'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [duration, setDuration] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'promotions'));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const promotionsData: Promotion[] = [];
      querySnapshot.forEach(doc => {
        promotionsData.push({ id: doc.id, ...doc.data() } as Promotion);
      });
      setPromotions(promotionsData);
      setIsLoading(false);
    });

    const fetchData = async () => {
      const [productsSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
      ]);
      setProducts(productsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setCategories(categoriesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    };

    fetchData();
    return () => unsubscribe();
  }, []);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const resetForm = () => {
    setTitle('');
    setTargetType('all');
    setSelectedCategories([]);
    setSelectedProducts([]);
    setDiscountAmount('');
    setDuration('');
  };

  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !discountAmount || !duration) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }
    if (targetType === 'category' && selectedCategories.length === 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Sélectionnez au moins une catégorie.' });
      return;
    }
    if (targetType === 'products' && selectedProducts.length === 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Sélectionnez au moins un produit.' });
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
        case '7j':  endDate = addDays(now, 7); break;
        case '30j': endDate = addDays(now, 30); break;
        default: throw new Error('Durée invalide');
      }

      const promoData: Record<string, any> = {
        title,
        targetType,
        discountAmount: Number(discountAmount),
        status: 'Actif',
        createdAt: serverTimestamp(),
        endDate: Timestamp.fromDate(endDate),
      };

      if (targetType === 'category') promoData.targetCategories = selectedCategories;
      if (targetType === 'products') promoData.targetProducts = selectedProducts;

      await addDoc(collection(db, 'promotions'), promoData);

      toast({ title: 'Succès ✅', description: `La promotion "${title}" a été créée.` });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de créer la promotion." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promotions', id));
      toast({ title: 'Succès', description: 'Promotion supprimée.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer.' });
    }
  };

  const getTargetLabel = (promo: Promotion) => {
    if (promo.targetType === 'all') return { icon: Globe, label: 'Tous les produits' };
    if (promo.targetType === 'category') {
      const names = (promo.targetCategories || [])
        .map(id => categories.find(c => c.id === id)?.name || id)
        .join(', ');
      return { icon: Layers, label: `Catégorie(s) : ${names || '...'}` };
    }
    if (promo.targetType === 'products') {
      const names = (promo.targetProducts || [])
        .map(id => products.find(p => p.id === id)?.name || id)
        .join(', ');
      return { icon: Users, label: `Produit(s) : ${names || '...'}` };
    }
    // Legacy
    return { icon: Tag, label: promo.productName || promo.variantStorage || 'Ancien format' };
  };

  const {
    searchTerm, setSearchTerm, sortBy, setSortBy, filterBy, setFilterBy,
    filtered: filteredPromotions, resetFilters, resultCount, totalCount,
  } = useAdminTableFilters(promotions, {
    searchFn: (p, term) =>
      searchInFields(p as unknown as Record<string, unknown>, term, ['title', 'status']) ||
      getTargetLabel(p).label.toLowerCase().includes(term),
    filterFn: (p, filter) => filter === 'all' || p.status === filter,
    sortFn: (a, b, sort) => {
      switch (sort) {
        case 'date-desc': return sortByDate(a.endDate, b.endDate, 'desc');
        case 'date-asc': return sortByDate(a.endDate, b.endDate, 'asc');
        case 'discount-desc': return sortByNumber(a.discountAmount ?? 0, b.discountAmount ?? 0, 'desc');
        case 'title-asc': return sortByString(a.title ?? '', b.title ?? '', 'asc');
        default: return 0;
      }
    },
    defaultSort: 'date-desc',
  });

  const promoFilterOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'Actif', label: 'Actif' },
    { value: 'Inactif', label: 'Inactif' },
  ];

  const promoSortOptions = [
    { value: 'date-desc', label: 'Date fin (récent)' },
    { value: 'date-asc', label: 'Date fin (ancien)' },
    { value: 'discount-desc', label: 'Réduction ↓' },
    { value: 'title-asc', label: 'Titre (A-Z)' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
            Promotions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Créez des réductions automatiques sur tous les produits, des catégories ou une sélection.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAddPromotion}>
              <DialogHeader>
                <DialogTitle>Créer une promotion</DialogTitle>
                <DialogDescription>
                  Définissez un montant de réduction appliqué automatiquement aux produits ciblés.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="promoTitle">Titre de la promotion *</Label>
                  <Input
                    id="promoTitle"
                    placeholder="ex: Soldes Été 2026, iPhone Day..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Target Type */}
                <div className="space-y-2">
                  <Label>Ciblage *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'all', icon: Globe, label: 'Tous les produits' },
                      { value: 'category', icon: Layers, label: 'Par catégorie' },
                      { value: 'products', icon: Users, label: 'Produits précis' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setTargetType(opt.value as any);
                          setSelectedCategories([]);
                          setSelectedProducts([]);
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                          targetType === opt.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        <opt.icon className="w-5 h-5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category selection */}
                {targetType === 'category' && (
                  <div className="space-y-2">
                    <Label>Catégories concernées *</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-xl p-3">
                      {categories.map(cat => (
                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={selectedCategories.includes(cat.id)}
                            onCheckedChange={() => toggleCategory(cat.id)}
                          />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product selection */}
                {targetType === 'products' && (
                  <div className="space-y-2">
                    <Label>Produits concernés *</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-xl p-3">
                      {products.map(product => (
                        <label key={product.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <span className="font-medium">{product.name}</span>
                          <span className="text-muted-foreground text-xs ml-auto">
                            {product.variants?.[0]?.price?.toLocaleString('fr-FR')} CFA
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discount Amount */}
                <div className="space-y-2">
                  <Label htmlFor="discountAmount">
                    Montant de la réduction (CFA) *
                  </Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min={1}
                    placeholder="ex: 10 000 → chaque iPhone sera réduit de 10 000 CFA"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Number(e.target.value))}
                    required
                  />
                  {discountAmount && (
                    <p className="text-xs text-muted-foreground bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                      💡 Exemple : iPhone 17 Pro Max à 890 000 CFA → <strong>{(890000 - Number(discountAmount)).toLocaleString('fr-FR')} CFA</strong> avec cette promo
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée de la promotion *</Label>
                  <Select value={duration} onValueChange={setDuration}>
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
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Annuler
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer la promotion
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
            Les réductions sont appliquées automatiquement à tous les prix des produits ciblés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher une promotion..."
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={promoSortOptions}
            filterBy={filterBy}
            onFilterChange={setFilterBy}
            filterOptions={promoFilterOptions}
            resultCount={resultCount}
            totalCount={totalCount}
            onReset={resetFilters}
            className="mb-4"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Ciblage</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Date de fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredPromotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucune promotion trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromotions.map(promo => {
                  const target = getTargetLabel(promo);
                  return (
                    <TableRow key={promo.id}>
                      <TableCell className="font-semibold">
                        {promo.title || promo.productName || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <target.icon className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                          <span className="line-clamp-1 max-w-[180px]">{target.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {promo.discountAmount
                          ? `-${Number(promo.discountAmount).toLocaleString('fr-FR')} CFA`
                          : promo.discountPrice
                          ? `${Number(promo.discountPrice).toLocaleString('fr-FR')} CFA`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {promo.endDate?.seconds
                          ? new Date(promo.endDate.seconds * 1000).toLocaleString('fr-FR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.status === 'Actif' ? 'default' : 'outline'}>
                          {promo.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Menu</span>
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
