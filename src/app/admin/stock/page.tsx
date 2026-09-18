'use client';

import { useState, useEffect } from 'react';
import { AdminTableFilters } from '@/components/admin/AdminTableFilters';
import { useAdminTableFilters, searchInFields, sortByString, sortByNumber, sortByDate } from '@/hooks/use-admin-table-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  QrCode, 
  Plus, 
  Tag, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  FileText, 
  Info,
  CheckCircle2,
  DollarSign,
  Phone,
  Printer
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/admin/qr-scanner';
import { invalidateCatalogCache } from '@/lib/product-cache';
import { normalizeDigits } from '@/lib/phone-utils';
import type { StockItem, Product, ProductVariant } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const fallbackStorages = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export default function StockPage() {
  const { toast } = useToast();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'lookup' | 'fillImei'>('lookup');
  
  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  // Facture / Reçu officiel de vente avec IMEI
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerPhone: string;
    productName: string;
    storage: string;
    condition: string;
    imei: string;
    price: number;
    amountReceived: number;
    remaining: number;
    status: string;
    note?: string;
  } | null>(null);

  // Formulaire ajout stock
  const [newImei, setNewImei] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [availableStorages, setAvailableStorages] = useState<string[]>(fallbackStorages);
  const [catalogPrice, setCatalogPrice] = useState<number>(0);
  const [isVenant, setIsVenant] = useState(false);
  const [isSecondHand, setIsSecondHand] = useState(false);
  const [hasCustomPrice, setHasCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [itemNote, setItemNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire vente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [createDebtOnRemaining, setCreateDebtOnRemaining] = useState(false);
  const [amountReceived, setAmountReceived] = useState<string>('');

  // Formulaire modification item
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    // Charger les produits actifs
    const qProducts = query(collection(db, 'products'), where('status', '==', 'active'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    });

    // Charger le stock (collection 'inventory')
    const qStock = query(collection(db, 'inventory'));
    const unsubscribeStock = onSnapshot(qStock, (snapshot) => {
      const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
      setStock(stockData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading inventory:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeStock();
    };
  }, []);

  // Synchronisation dynamique quand le produit sélectionné change
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product && product.variants && product.variants.length > 0) {
      const storages = product.variants.map((v: ProductVariant) => v.storage);
      setAvailableStorages(storages);
      const defaultStorage = storages[0];
      setSelectedStorage(defaultStorage);
      const variant = product.variants.find((v: ProductVariant) => v.storage === defaultStorage);
      const price = variant?.price || 0;
      setCatalogPrice(price);
      if (!hasCustomPrice) {
        setCustomPrice(String(price));
      }
    } else {
      setAvailableStorages(fallbackStorages);
      setSelectedStorage(fallbackStorages[0]);
      setCatalogPrice(0);
      if (!hasCustomPrice) {
        setCustomPrice('0');
      }
    }
  };

  // Synchronisation quand le stockage change
  const handleStorageChange = (storage: string) => {
    setSelectedStorage(storage);
    const product = products.find(p => p.id === selectedProductId);
    if (product && product.variants) {
      const variant = product.variants.find((v: ProductVariant) => v.storage === storage);
      const price = variant?.price || 0;
      setCatalogPrice(price);
      if (!hasCustomPrice) {
        setCustomPrice(String(price));
      }
    }
  };

  const openAddStockDialog = () => {
    setNewImei('');
    setIsVenant(false);
    setIsSecondHand(false);
    setHasCustomPrice(false);
    setCustomPrice('');
    setItemNote('');

    if (products.length > 0) {
      handleProductChange(products[0].id);
    } else {
      setSelectedProductId('');
      setSelectedStorage(fallbackStorages[0]);
      setCatalogPrice(0);
    }
    setIsAddDialogOpen(true);
  };

  const handleAddStock = async () => {
    const cleanImei = normalizeDigits(newImei);
    if (!/^\d{15}$/.test(cleanImei) || !selectedProductId || !selectedStorage) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez renseigner le produit, le stockage et l\'IMEI.' });
      return;
    }

    // Vérification d'unicité de l'IMEI en stock actif
    const duplicate = stock.find(s => s.imei.trim().toLowerCase() === cleanImei.toLowerCase() && s.status === 'disponible');
    if (duplicate) {
      toast({ 
        variant: 'destructive', 
        title: 'IMEI déjà présent', 
        description: `L'IMEI ${cleanImei} est déjà enregistré en stock pour ${duplicate.productName} (${duplicate.storage}).` 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const product = products.find(p => p.id === selectedProductId);
      const finalUnitPrice = hasCustomPrice && Number(customPrice) > 0 
        ? Number(customPrice) 
        : catalogPrice;

      await addDoc(collection(db, 'inventory'), {
        productId: selectedProductId,
        productName: product?.name || 'Inconnu',
        imei: cleanImei,
        storage: selectedStorage,
        status: 'disponible',
        catalogPrice: Number(catalogPrice) || 0,
        originalPrice: Number(catalogPrice) || 0,
        unitPrice: Number(finalUnitPrice) || 0,
        hasCustomPrice: Boolean(hasCustomPrice),
        isVenant: Boolean(isVenant),
        isSecondHand: Boolean(isSecondHand),
        note: itemNote.trim() || null,
        addedAt: serverTimestamp()
      });

      toast({ title: 'Appareil ajouté', description: `L'IMEI ${cleanImei} a été enregistré avec succès.` });
      // Invalider le cache pour affichage immédiat sur l'accueil
      invalidateCatalogCache();
      setIsAddDialogOpen(false);
      setNewImei('');
      setItemNote('');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter au stock." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScan = async (imei: string) => {
    setIsScannerOpen(false);
    const cleanImei = normalizeDigits(imei);

    if (scannerMode === 'fillImei') {
      setNewImei(cleanImei);
      toast({ title: 'IMEI détecté', description: 'Le numéro a été rempli automatiquement.' });
      return;
    }

    setSearchTerm(cleanImei);
    
    const item = stock.find(s => s.imei.trim().toLowerCase() === cleanImei.toLowerCase());
    if (item) {
      if (item.status === 'disponible') {
        openSellDialog(item);
      } else {
        toast({ title: 'Appareil déjà vendu', description: `L'appareil ${item.productName} (IMEI: ${cleanImei}) est déjà marqué vendu.` });
      }
    } else {
      toast({ 
        variant: 'destructive', 
        title: 'Non trouvé dans le stock', 
        description: `Aucun appareil trouvé avec l'IMEI: ${cleanImei}. Vous pouvez l'ajouter via "Ajouter au stock".` 
      });
      openAddStockDialog();
      // Préremplir l'IMEI après l'initialisation du formulaire, qui réinitialise ses champs.
      setNewImei(cleanImei);
    }
  };

  const openSellDialog = (item: StockItem) => {
    setSelectedItem(item);
    const defaultPrice = item.unitPrice || item.catalogPrice || item.finalPrice || 0;
    setSellPrice(defaultPrice);
    setCustomerName(item.customerName || '');
    setCustomerPhone(item.customerPhone || '');
    setAmountReceived(String(defaultPrice));
    setCreateDebtOnRemaining(false);
    setIsSellDialogOpen(true);
  };

  const handleConfirmSell = async () => {
    if (!selectedItem) return;
    if (!customerName.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom du client est requis.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const price = Number(sellPrice) || 0;
      const received = Number(amountReceived) || 0;
      const remaining = Math.max(0, price - received);

      // 1. Mettre à jour l'item en vendu
      await updateDoc(doc(db, 'inventory', selectedItem.id), {
        status: 'vendu',
        soldAt: serverTimestamp(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        finalPrice: price
      });

      // 2. Si le client doit un reliquat et l'option dette est cochée, créer la dette automatiquement
      if (createDebtOnRemaining && remaining > 0) {
        const parts = customerName.trim().split(/\s+/);
        const fName = parts[0] || '';
        const lName = parts.slice(1).join(' ') || '';

        await addDoc(collection(db, 'debts'), {
          firstName: fName,
          lastName: lName,
          customerName: customerName.trim(),
          phone: customerPhone.trim() || 'Non renseigné',
          item: `${selectedItem.productName} (${selectedItem.storage}) - IMEI: ${selectedItem.imei}`,
          quantity: 1,
          amountDue: price,
          amountPaid: received,
          amountRemaining: remaining,
          date: new Date().toISOString().split('T')[0],
          dueDate: null,
          note: `Vente boutique IMEI ${selectedItem.imei}. Acompte reçu : ${received.toLocaleString('fr-FR')} CFA.`,
          status: 'Partiellement payé',
          payments: received > 0 ? [{
            id: Date.now().toString(),
            amount: received,
            date: new Date().toISOString(),
            note: "Acompte à la vente",
          }] : [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const invNumber = `FAC-${Date.now().toString().slice(-6)}`;
      const invDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const conditionStr = selectedItem.isVenant ? 'Venant' : (selectedItem.isSecondHand ? 'Deuxième main' : 'Standard');
      
      setInvoiceData({
        invoiceNumber: invNumber,
        date: invDate,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || 'Non renseigné',
        productName: selectedItem.productName,
        storage: selectedItem.storage,
        condition: conditionStr,
        imei: selectedItem.imei,
        price: price,
        amountReceived: received,
        remaining: remaining,
        status: remaining === 0 ? 'Payé intégralement' : 'Acompte versé',
        note: selectedItem.note || '',
      });

      toast({ 
        title: 'Vente validée !', 
        description: `Vente de l'appareil ${selectedItem.productName} (${selectedItem.storage}) enregistrée avec succès.` 
      });
      invalidateCatalogCache();
      setIsSellDialogOpen(false);
      setSelectedItem(null);
      setIsInvoiceOpen(true);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer la vente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInvoiceForItem = (item: StockItem) => {
    const invNumber = `FAC-${item.id.slice(-6).toUpperCase()}`;
    const invDate = item.soldAt 
      ? (item.soldAt.toDate ? item.soldAt.toDate() : new Date(item.soldAt)).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const conditionStr = item.isVenant ? 'Venant' : (item.isSecondHand ? 'Deuxième main' : 'Standard');
    const price = Number(item.finalPrice || item.unitPrice || item.catalogPrice || 0);

    setInvoiceData({
      invoiceNumber: invNumber,
      date: invDate,
      customerName: item.customerName || 'Client Boutique',
      customerPhone: item.customerPhone || 'Non renseigné',
      productName: item.productName,
      storage: item.storage,
      condition: conditionStr,
      imei: item.imei,
      price: price,
      amountReceived: price,
      remaining: 0,
      status: 'Payé intégralement',
      note: item.note || '',
    });
    setIsInvoiceOpen(true);
  };

  const openEditDialog = (item: StockItem) => {
    setSelectedItem(item);
    setEditPrice(item.unitPrice || item.finalPrice || item.catalogPrice || 0);
    setEditNote(item.note || '');
    setIsEditItemOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const updatePayload: Record<string, any> = {
        note: editNote.trim() || null,
      };

      if (selectedItem.status === 'disponible') {
        updatePayload.unitPrice = Number(editPrice) || 0;
        updatePayload.hasCustomPrice = true;
      } else {
        updatePayload.finalPrice = Number(editPrice) || 0;
      }

      await updateDoc(doc(db, 'inventory', selectedItem.id), updatePayload);
      toast({ title: 'Fiche mise à jour', description: 'Les informations du stock ont été enregistrées.' });
      invalidateCatalogCache();
      setIsEditItemOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour la fiche.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Voulez-vous supprimer cet appareil du stock ?")) return;
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
      invalidateCatalogCache();
      toast({ title: 'Supprimé', description: 'Appareil retiré de l\'inventaire.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer.' });
    }
  };

  // Filtres et recherche
  const {
    searchTerm, setSearchTerm, sortBy, setSortBy, filterBy, setFilterBy,
    filtered: filteredStock, resetFilters, resultCount, totalCount,
  } = useAdminTableFilters(stock, {
    searchFn: (item, term) =>
      searchInFields(item as unknown as Record<string, unknown>, term, [
        'imei', 'productName', 'storage', 'customerName', 'customerPhone', 'note'
      ]),
    filterFn: (item, filter) => filter === 'all' || item.status === filter,
    sortFn: (a, b, sort) => {
      switch (sort) {
        case 'product-asc': return sortByString(a.productName, b.productName, 'asc');
        case 'product-desc': return sortByString(a.productName, b.productName, 'desc');
        case 'date-desc': return sortByDate(a.addedAt, b.addedAt, 'desc');
        case 'date-asc': return sortByDate(a.addedAt, b.addedAt, 'asc');
        case 'price-desc': return sortByNumber((a.unitPrice || a.finalPrice || 0), (b.unitPrice || b.finalPrice || 0), 'desc');
        default: return 0;
      }
    },
    defaultSort: 'date-desc',
  });

  const stockFilterOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'disponible', label: 'En stock' },
    { value: 'vendu', label: 'Vendu' },
  ];

  const stockSortOptions = [
    { value: 'date-desc', label: 'Date d\'ajout (récent)' },
    { value: 'date-asc', label: 'Date d\'ajout (ancien)' },
    { value: 'product-asc', label: 'Produit (A-Z)' },
    { value: 'product-desc', label: 'Produit (Z-A)' },
    { value: 'price-desc', label: 'Prix décroissant' },
  ];

  const inStockCount = stock.filter(s => s.status === 'disponible').length;
  const soldCount = stock.filter(s => s.status === 'vendu').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestion du Stock (IMEI)</h1>
          <p className="text-muted-foreground text-sm">
            Inventaire unitaire des iPhones, traçabilité par numéro IMEI, venant/deuxième main et prix spécifiques.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsScannerOpen(true)} variant="outline" className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
            <QrCode className="mr-2 h-4 w-4" />
            Scanner Caméra / Photo
          </Button>
          <Button onClick={openAddStockDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter au stock
          </Button>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 border-l-4 border-l-primary">
          <span className="text-xs text-muted-foreground block">Total Unités</span>
          <span className="text-2xl font-bold">{stock.length}</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs text-muted-foreground block">Disponibles en stock</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{inStockCount}</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-muted-foreground col-span-2 sm:col-span-1">
          <span className="text-xs text-muted-foreground block">Vendus</span>
          <span className="text-2xl font-bold text-muted-foreground">{soldCount}</span>
        </Card>
      </div>

      {/* Tableau du stock */}
      <Card>
        <CardHeader>
          <AdminTableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher par IMEI, modèle, client ou note..."
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={stockSortOptions}
            filterBy={filterBy}
            onFilterChange={setFilterBy}
            filterOptions={stockFilterOptions}
            resultCount={resultCount}
            totalCount={totalCount}
            onReset={resetFilters}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground mt-2">Chargement du stock...</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Modèle</TableHead>
                    <TableHead>Stockage</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Prix de vente</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Note / Échange</TableHead>
                    <TableHead>Client / Vente</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Aucun appareil trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStock.map((item) => {
                      const displayPrice = item.status === 'vendu' 
                        ? item.finalPrice 
                        : (item.unitPrice || item.catalogPrice);

                      return (
                        <TableRow key={item.id}>
                          {/* IMEI */}
                          <TableCell className="font-mono text-xs font-semibold tracking-wider">
                            {item.imei}
                          </TableCell>

                          {/* Produit */}
                          <TableCell className="font-medium text-foreground">
                            {item.productName}
                          </TableCell>

                          {/* Stockage */}
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.storage}
                            </Badge>
                          </TableCell>

                          {/* État (Venant / Deuxième main) */}
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.isVenant && (
                                <Badge className="bg-sky-600 hover:bg-sky-700 text-[10px] px-1.5 py-0">
                                  Venant
                                </Badge>
                              )}
                              {item.isSecondHand && (
                                <Badge className="bg-amber-600 hover:bg-amber-700 text-[10px] px-1.5 py-0">
                                  2e main
                                </Badge>
                              )}
                              {!item.isVenant && !item.isSecondHand && (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Prix de vente */}
                          <TableCell>
                            <div>
                              <span className="font-semibold text-foreground text-sm">
                                {displayPrice ? `${Number(displayPrice).toLocaleString('fr-FR')} CFA` : '-'}
                              </span>
                              {item.hasCustomPrice && item.status === 'disponible' && (
                                <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                  Prix personnalisé
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Statut */}
                          <TableCell>
                            <Badge variant={item.status === 'disponible' ? 'default' : 'secondary'}>
                              {item.status === 'disponible' ? 'En stock' : 'Vendu'}
                            </Badge>
                          </TableCell>

                          {/* Note / Échange */}
                          <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground" title={item.note || ''}>
                            {item.note || '-'}
                          </TableCell>

                          {/* Client / Vente */}
                          <TableCell>
                            {item.status === 'vendu' ? (
                              <div className="text-xs">
                                <p className="font-semibold text-foreground">{item.customerName || 'Inconnu'}</p>
                                {item.customerPhone && (
                                  <p className="text-muted-foreground flex items-center gap-1 font-mono">
                                    <Phone className="h-2.5 w-2.5" />
                                    {item.customerPhone}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              {item.status === 'disponible' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => openSellDialog(item)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1"
                                >
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                  Vendre
                                </Button>
                              )}

                              {item.status === 'vendu' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleOpenInvoiceForItem(item)}
                                  className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                  title="Imprimer la Facture / Reçu officiel"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  Facture
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                                  {item.status === 'vendu' && (
                                    <DropdownMenuItem onClick={() => handleOpenInvoiceForItem(item)}>
                                      <Printer className="mr-2 h-4 w-4 text-primary" />
                                      Imprimer Facture (avec IMEI)
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier Prix & Note
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scanner QR / Code-Barres Modal */}
      {isScannerOpen && (
        <QRScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
      )}

      {/* Modal : Ajouter un appareil au stock */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Ajouter un iPhone au stock
            </DialogTitle>
            <DialogDescription>
              Sélectionnez le modèle depuis le catalogue, précisez l&apos;état et saisissez l&apos;IMEI unique.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Sélection Produit */}
            <div className="space-y-1.5">
              <Label>Modèle du produit *</Label>
              <Select value={selectedProductId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sélection Stockage & Prix catalogue auto */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stockage *</Label>
                <Select value={selectedStorage} onValueChange={handleStorageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Capacité" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStorages.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Prix catalogue</Label>
                <div className="h-10 px-3 py-2 bg-muted/60 border rounded-md font-semibold text-sm flex items-center justify-between text-muted-foreground">
                  <span>{catalogPrice.toLocaleString('fr-FR')} CFA</span>
                  <Tag className="h-3.5 w-3.5 text-muted-foreground/70" />
                </div>
              </div>
            </div>

            {/* Options État : Venant & Deuxième main */}
            <div className="p-3 bg-muted/30 rounded-lg border space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                État de l&apos;appareil
              </Label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <Checkbox 
                    checked={isVenant} 
                    onCheckedChange={(checked) => {
                      const val = Boolean(checked);
                      setIsVenant(val);
                      if (val) setIsSecondHand(false);
                    }} 
                  />
                  <span>Venant</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <Checkbox 
                    checked={isSecondHand} 
                    onCheckedChange={(checked) => {
                      const val = Boolean(checked);
                      setIsSecondHand(val);
                      if (val) setIsVenant(false);
                    }} 
                  />
                  <span>Deuxième main</span>
                </label>
              </div>
            </div>

            {/* Option Nouveau prix spécifique */}
            <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <Checkbox 
                  checked={hasCustomPrice} 
                  onCheckedChange={(checked) => {
                    const isChecked = Boolean(checked);
                    setHasCustomPrice(isChecked);
                    if (isChecked && (!customPrice || customPrice === '0')) {
                      setCustomPrice(String(catalogPrice));
                    }
                  }} 
                />
                <span>Voulez-vous définir un nouveau prix ?</span>
              </label>

              {hasCustomPrice && (
                <div className="pt-2 border-t border-border/50 space-y-1.5 animate-in fade-in">
                  <Label htmlFor="custom-price" className="text-xs">Nouveau prix de vente (CFA) *</Label>
                  <Input 
                    id="custom-price" 
                    type="number" 
                    min="0"
                    value={customPrice} 
                    onChange={(e) => setCustomPrice(e.target.value)} 
                    placeholder="Ex: 135000"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Ce prix s&apos;appliquera uniquement à cette unité sans modifier le catalogue général.
                  </p>
                </div>
              )}
            </div>

            {/* Numéro IMEI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="imei">Numéro IMEI (15 chiffres) *</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-primary gap-1 px-1.5"
                  onClick={() => {
                    setScannerMode('fillImei');
                    setIsScannerOpen(true);
                  }}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Scanner
                </Button>
              </div>
              <Input 
                id="imei" 
                value={newImei} 
                onChange={(e) => setNewImei(e.target.value)} 
                placeholder="Ex: 354896102345678" 
                className="font-mono"
                required
              />
            </div>

            {/* Note / Remarque / Échange */}
            <div className="space-y-1.5">
              <Label htmlFor="itemNote">Note / Remarque (facultatif)</Label>
              <Textarea 
                id="itemNote" 
                value={itemNote} 
                onChange={(e) => setItemNote(e.target.value)} 
                placeholder="Ex: Échange contre iPhone X + 40 000 FCFA, batterie 88%, état nickel..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddStock} disabled={isSubmitting || !newImei.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter au stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal : Vente boutique */}
      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              Enregistrer une vente boutique
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.productName} ({selectedItem?.storage}) - IMEI: <span className="font-mono font-medium text-foreground">{selectedItem?.imei}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name">Prénom & Nom du client *</Label>
                <Input 
                  id="cust-name" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  placeholder="Ex: Amadou Ba" 
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Téléphone</Label>
                <Input 
                  id="cust-phone" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)} 
                  placeholder="Ex: 77 000 00 00" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sell-price">Prix de vente convenu (CFA) *</Label>
                <Input 
                  id="sell-price" 
                  type="number" 
                  min="0"
                  value={sellPrice} 
                  onChange={(e) => setSellPrice(Number(e.target.value))} 
                  placeholder="Ex: 150000" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount-received">Montant encaissé (CFA)</Label>
                <Input 
                  id="amount-received" 
                  type="number" 
                  min="0"
                  max={sellPrice}
                  value={amountReceived} 
                  onChange={(e) => setAmountReceived(e.target.value)} 
                  placeholder="Ex: 150000" 
                />
              </div>
            </div>

            {/* Reliquat / Dette automatique */}
            {sellPrice > Number(amountReceived || 0) && (
              <div className="p-3 bg-red-50/20 border border-red-200 dark:border-red-900 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reliquat impayé :</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {(sellPrice - Number(amountReceived || 0)).toLocaleString('fr-FR')} CFA
                  </span>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Checkbox 
                    checked={createDebtOnRemaining} 
                    onCheckedChange={(checked) => setCreateDebtOnRemaining(Boolean(checked))} 
                  />
                  <span>Créer automatiquement une dette pour ce solde ?</span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSellDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleConfirmSell} 
              disabled={isSubmitting || !customerName.trim()} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer la vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal : Modifier Prix / Note */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Modifier la fiche de l&apos;appareil</DialogTitle>
            <DialogDescription>
              IMEI : <span className="font-mono">{selectedItem?.imei}</span> ({selectedItem?.productName})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-price">Prix (CFA)</Label>
              <Input 
                id="edit-price" 
                type="number" 
                min="0"
                value={editPrice} 
                onChange={(e) => setEditPrice(Number(e.target.value))} 
                placeholder="Ex: 145000" 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-note">Remarque / Note</Label>
              <Textarea 
                id="edit-note" 
                value={editNote} 
                onChange={(e) => setEditNote(e.target.value)} 
                placeholder="Détails, état, provenance..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdateItem} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal : Facture & Reçu Officiel de Vente (avec IMEI) */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b no-print flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                Facture & Reçu de Vente Officiel
              </DialogTitle>
              <DialogDescription className="text-xs">
                Document officiel avec traçabilité IMEI pour le client et la garantie 1 mois.
              </DialogDescription>
            </div>
            <Button 
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              size="sm"
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Imprimer / PDF
            </Button>
          </DialogHeader>

          {invoiceData && (
            <div className="overflow-y-auto p-6 bg-white text-zinc-900" id="printable-invoice">
              {/* En-tête Boutique */}
              <div className="flex items-start justify-between border-b pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-black">SAKHO APPLE</h2>
                  <p className="text-xs text-zinc-600 font-medium">Boutique Spécialisée iPhones & Produits Apple</p>
                  <p className="text-xs text-zinc-500">Dakar, Sénégal</p>
                  <p className="text-xs text-zinc-500 font-mono">Tél / WhatsApp : +221 77 000 00 00</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-block px-2.5 py-1 rounded bg-black text-white text-[11px] font-bold tracking-wider uppercase">
                    Facture / Reçu
                  </span>
                  <p className="text-xs font-mono font-bold text-zinc-700">{invoiceData.invoiceNumber}</p>
                  <p className="text-[11px] text-zinc-500">{invoiceData.date}</p>
                </div>
              </div>

              {/* Bloc Client */}
              <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200 mb-5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Facturé à</span>
                  <p className="font-bold text-sm text-zinc-900">{invoiceData.customerName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Contact Client</span>
                  <p className="font-mono text-zinc-800 font-semibold">{invoiceData.customerPhone}</p>
                </div>
              </div>

              {/* Tableau Produit Vendu */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden mb-5">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold border-b border-zinc-200">
                    <tr>
                      <th className="p-3">Désignation & Caractéristiques</th>
                      <th className="p-3 text-center">État</th>
                      <th className="p-3 text-right">Prix Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    <tr>
                      <td className="p-3 space-y-1.5">
                        <div className="font-bold text-sm text-zinc-900">
                          {invoiceData.productName} ({invoiceData.storage})
                        </div>
                        {/* IMEI OFFICIEL ENCADRÉ POUR GARANTIE */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-950">
                          <span className="text-[10px] font-bold uppercase tracking-wider">N° IMEI :</span>
                          <span className="font-mono font-black text-xs tracking-widest">{invoiceData.imei}</span>
                        </div>
                        {invoiceData.note && (
                          <p className="text-[11px] text-zinc-500 italic">Note : {invoiceData.note}</p>
                        )}
                      </td>
                      <td className="p-3 text-center align-top">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-200 text-zinc-800">
                          {invoiceData.condition}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-sm text-zinc-900 align-top">
                        {invoiceData.price.toLocaleString('fr-FR')} CFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totaux & Règlements */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Total de la vente :</span>
                    <span className="font-semibold">{invoiceData.price.toLocaleString('fr-FR')} CFA</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Montant encaissé :</span>
                    <span className="font-semibold">{invoiceData.amountReceived.toLocaleString('fr-FR')} CFA</span>
                  </div>
                  {invoiceData.remaining > 0 && (
                    <div className="flex justify-between text-red-600 font-bold border-t pt-1">
                      <span>Reste à payer :</span>
                      <span>{invoiceData.remaining.toLocaleString('fr-FR')} CFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-900 font-black text-sm border-t border-zinc-300 pt-2">
                    <span>Statut :</span>
                    <span className={invoiceData.remaining === 0 ? "text-emerald-700" : "text-amber-700"}>
                      {invoiceData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clause de garantie & Signatures */}
              <div className="border-t border-zinc-200 pt-4 space-y-4">
                <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-600 leading-relaxed">
                  <strong>Conditions de Garantie (1 Mois) :</strong> Cet appareil bénéficie d'une garantie de bon fonctionnement matériel d'un (1) mois à compter de ce jour. Le numéro IMEI mentionné ci-dessus fait foi pour toute prise en charge. La garantie ne couvre pas les chocs, l'immersion dans un liquide, ou les ouvertures par un tiers.
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 text-center text-xs text-zinc-600">
                  <div>
                    <p className="font-bold text-zinc-800 mb-10">Signature & Cachet Sakho Apple</p>
                    <div className="border-b border-zinc-300 mx-8"></div>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-800 mb-10">Signature du Client</p>
                    <div className="border-b border-zinc-300 mx-8"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-3 border-t bg-zinc-50 no-print flex justify-between sm:justify-between items-center">
            <Button variant="outline" size="sm" onClick={() => setIsInvoiceOpen(false)}>
              Fermer
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Imprimer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
