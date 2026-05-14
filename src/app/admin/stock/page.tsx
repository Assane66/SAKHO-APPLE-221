'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, QrCode, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/admin/qr-scanner';
import type { StockItem, Product } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StockPage() {
  const { toast } = useToast();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  // Formulaire ajout
  const [newImei, setNewImei] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire vente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    // Charger les produits pour le select
    const qProducts = query(collection(db, 'products'), where('status', '==', 'active'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    });

    // Charger le stock (collection 'inventory' selon la capture d'écran)
    const qStock = query(collection(db, 'inventory'));
    const unsubscribeStock = onSnapshot(qStock, (snapshot) => {
      const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
      setStock(stockData);
      setLoading(loading && false);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeStock();
    };
  }, []);

  const handleAddStock = async () => {
    if (!newImei || !selectedProductId || !selectedStorage) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const product = products.find(p => p.id === selectedProductId);
      await addDoc(collection(db, 'inventory'), {
        productId: selectedProductId,
        productName: product?.name || 'Inconnu',
        imei: newImei,
        storage: selectedStorage,
        status: 'disponible',
        addedAt: serverTimestamp()
      });
      toast({ title: 'Succès', description: 'Appareil ajouté au stock.' });
      setIsAddDialogOpen(false);
      setNewImei('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter au stock." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScan = async (imei: string) => {
    setIsScannerOpen(false);
    setSearchTerm(imei);
    
    // Rechercher l'item dans le stock local d'abord
    const item = stock.find(s => s.imei === imei);
    if (item) {
      if (item.status === 'available') {
        setSelectedItem(item);
        setIsSellDialogOpen(true);
      } else {
        toast({ title: 'Info', description: `Cet appareil (IMEI: ${imei}) est déjà vendu.` });
      }
    } else {
      toast({ variant: 'destructive', title: 'Non trouvé', description: `Aucun appareil trouvé avec l'IMEI: ${imei}` });
    }
  };

  const handleSell = async () => {
    if (!selectedItem || !customerName) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom du client est obligatoire.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'inventory', selectedItem.id), {
        status: 'vendu',
        soldAt: serverTimestamp(),
        customerName,
        customerPhone
      });
      toast({ title: 'Vendu !', description: `La vente de l'IMEI ${selectedItem.imei} a été enregistrée.` });
      setIsSellDialogOpen(false);
      setSelectedItem(null);
      setCustomerName('');
      setCustomerPhone('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Erreur lors de l'enregistrement de la vente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStock = stock.filter(item => 
    item.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Stock (IMEI)</h1>
          <p className="text-muted-foreground">Gérez vos iPhones uniques et scannez-les pour les ventes en boutique.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsScannerOpen(true)} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            <QrCode className="mr-2 h-4 w-4" />
            Scanner QR Code
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter au stock
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par IMEI, modèle ou client..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Stockage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Client / Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun appareil trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStock.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.imei}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.storage}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'disponible' ? 'default' : 'secondary'}>
                            {item.status === 'disponible' ? 'En stock' : 'Vendu'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.status === 'sold' ? (
                            <div className="text-xs">
                              <p className="font-semibold">{item.customerName}</p>
                              <p className="text-muted-foreground">{item.customerPhone}</p>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === 'disponible' && (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); setIsSellDialogOpen(true); }}>
                              Vendre
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scanner Modal */}
      {isScannerOpen && (
        <QRScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
      )}

      {/* Add Stock Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un iPhone au stock</DialogTitle>
            <DialogDescription>Entrez l'IMEI unique pour cet appareil spécifique.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select onValueChange={setSelectedProductId}>
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
            <div className="space-y-2">
              <Label>Stockage</Label>
              <Select onValueChange={setSelectedStorage}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le stockage" />
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
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input id="imei" value={newImei} onChange={(e) => setNewImei(e.target.value)} placeholder="Ex: 356789..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddStock} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter au stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer une vente boutique</DialogTitle>
            <DialogDescription>
              Appareil : {selectedItem?.productName} ({selectedItem?.storage})<br/>
              IMEI : {selectedItem?.imei}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Nom du client</Label>
              <Input id="cust-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Prénom et Nom" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Téléphone du client</Label>
              <Input id="cust-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Ex: 77..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSellDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSell} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer la vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
