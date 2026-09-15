// src/app/admin/debts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  DocumentData 
} from 'firebase/firestore';
import { Debt, DebtStatus, DebtPayment } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { AdminTableFilters } from '@/components/admin/AdminTableFilters';
import { useAdminTableFilters, sortByString, sortByNumber, sortByDate, searchInFields } from '@/hooks/use-admin-table-filters';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  HandCoins, 
  Plus, 
  MoreHorizontal, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Phone, 
  Calendar,
  History,
  Trash2,
  Edit,
  TrendingDown,
  Layers
} from "lucide-react";

const statusBadgeVariant: Record<DebtStatus, "destructive" | "secondary" | "default"> = {
  'À payer': 'destructive',
  'Partiellement payé': 'secondary',
  'Payé': 'default',
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    item: '',
    quantity: 1,
    amountDue: '',
    initialPaid: '0',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    note: '',
  });

  // Form state for Payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    const q = query(collection(db, "debts"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtList: Debt[] = [];
      snapshot.forEach((docSnap) => {
        debtList.push({ id: docSnap.id, ...docSnap.data() } as Debt);
      });
      setDebts(debtList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching debts:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter & Search
  const {
    searchTerm, setSearchTerm, sortBy, setSortBy, filterBy, setFilterBy,
    filtered: filteredDebts, resetFilters, resultCount, totalCount,
  } = useAdminTableFilters(debts, {
    searchFn: (d, term) =>
      searchInFields(d as unknown as Record<string, unknown>, term, [
        'firstName', 'lastName', 'customerName', 'phone', 'item', 'note'
      ]),
    filterFn: (d, filter) => filter === 'all' || d.status === filter,
    sortFn: (a, b, sort) => {
      switch (sort) {
        case 'date-desc': return sortByDate(a.date, b.date, 'desc');
        case 'date-asc': return sortByDate(a.date, b.date, 'asc');
        case 'remaining-desc': return sortByNumber(a.amountRemaining, b.amountRemaining, 'desc');
        case 'remaining-asc': return sortByNumber(a.amountRemaining, b.amountRemaining, 'asc');
        case 'name-asc': return sortByString(a.firstName + ' ' + a.lastName, b.firstName + ' ' + b.lastName, 'asc');
        default: return 0;
      }
    },
  });

  const sortOptions = [
    { value: 'date-desc', label: 'Date récente' },
    { value: 'date-asc', label: 'Date ancienne' },
    { value: 'remaining-desc', label: 'Reste à payer ↓' },
    { value: 'remaining-asc', label: 'Reste à payer ↑' },
    { value: 'name-asc', label: 'Nom (A-Z)' },
  ];

  const filterOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'À payer', label: 'À payer' },
    { value: 'Partiellement payé', label: 'Partiellement payé' },
    { value: 'Payé', label: 'Payé' },
  ];

  // Stats calculation
  const totalDue = debts.reduce((sum, d) => sum + (Number(d.amountDue) || 0), 0);
  const totalRemaining = debts.reduce((sum, d) => sum + (Number(d.amountRemaining) || 0), 0);
  const activeDebts = debts.filter(d => d.status !== 'Payé');
  const paidDebts = debts.filter(d => d.status === 'Payé');

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      if (typeof date === 'string') {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(date);
    }
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
      phone: '',
      item: '',
      quantity: 1,
      amountDue: '',
      initialPaid: '0',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      note: '',
    });
    setSelectedDebt(null);
    setIsAddEditOpen(true);
  };

  const openEditModal = (debt: Debt) => {
    setSelectedDebt(debt);
    let dateStr = '';
    try {
      const d = debt.date?.toDate ? debt.date.toDate() : new Date(debt.date);
      dateStr = d.toISOString().split('T')[0];
    } catch {
      dateStr = '';
    }

    setFormData({
      id: debt.id,
      firstName: debt.firstName || '',
      lastName: debt.lastName || '',
      phone: debt.phone || '',
      item: debt.item || '',
      quantity: debt.quantity || 1,
      amountDue: String(debt.amountDue || 0),
      initialPaid: String(debt.amountPaid || 0),
      date: dateStr || new Date().toISOString().split('T')[0],
      dueDate: debt.dueDate || '',
      note: debt.note || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.phone.trim() || !formData.item.trim() || !formData.amountDue) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir les champs obligatoires (Prénom, Téléphone, Article, Montant)." });
      return;
    }

    const due = Number(formData.amountDue) || 0;
    const paid = Number(formData.initialPaid) || 0;
    const remaining = Math.max(0, due - paid);
    
    let status: DebtStatus = 'À payer';
    if (remaining === 0) {
      status = 'Payé';
    } else if (paid > 0) {
      status = 'Partiellement payé';
    }

    const customerName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    setIsSubmitting(true);
    try {
      if (selectedDebt) {
        // Edit existing
        await updateDoc(doc(db, "debts", selectedDebt.id), {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          customerName,
          phone: formData.phone.trim(),
          item: formData.item.trim(),
          quantity: Number(formData.quantity) || 1,
          amountDue: due,
          amountPaid: paid,
          amountRemaining: remaining,
          date: formData.date,
          dueDate: formData.dueDate || null,
          note: formData.note.trim() || null,
          status,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Modifiée", description: "La dette a été mise à jour avec succès." });
      } else {
        // Create new
        const payments: DebtPayment[] = [];
        if (paid > 0) {
          payments.push({
            id: Date.now().toString(),
            amount: paid,
            date: new Date().toISOString(),
            note: "Acompte initial",
          });
        }

        await addDoc(collection(db, "debts"), {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          customerName,
          phone: formData.phone.trim(),
          item: formData.item.trim(),
          quantity: Number(formData.quantity) || 1,
          amountDue: due,
          amountPaid: paid,
          amountRemaining: remaining,
          date: formData.date,
          dueDate: formData.dueDate || null,
          note: formData.note.trim() || null,
          status,
          payments,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Enregistrée", description: "La nouvelle dette a été créée." });
      }
      setIsAddEditOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la dette." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount('');
    setPaymentNote('');
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "Montant invalide", description: "Veuillez entrer un montant supérieur à 0." });
      return;
    }

    if (amount > selectedDebt.amountRemaining) {
      toast({ variant: "destructive", title: "Montant trop élevé", description: `Le versement ne peut pas dépasser le reste dû (${selectedDebt.amountRemaining.toLocaleString('fr-FR')} CFA).` });
      return;
    }

    setIsSubmitting(true);
    try {
      const newPaid = (selectedDebt.amountPaid || 0) + amount;
      const newRemaining = Math.max(0, selectedDebt.amountDue - newPaid);
      const newStatus: DebtStatus = newRemaining === 0 ? 'Payé' : 'Partiellement payé';

      const newPayment: DebtPayment = {
        id: Date.now().toString(),
        amount,
        date: new Date().toISOString(),
        note: paymentNote.trim() || undefined,
      };

      const existingPayments = selectedDebt.payments || [];

      await updateDoc(doc(db, "debts", selectedDebt.id), {
        amountPaid: newPaid,
        amountRemaining: newRemaining,
        status: newStatus,
        payments: [...existingPayments, newPayment],
        updatedAt: serverTimestamp(),
      });

      toast({ 
        title: "Paiement validé", 
        description: `${amount.toLocaleString('fr-FR')} CFA enregistrés. Nouveau reste : ${newRemaining.toLocaleString('fr-FR')} CFA.` 
      });
      setIsPaymentOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le paiement." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette dette ? Cette action est irréversible.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "debts", debtId));
      toast({ title: "Supprimée", description: "La dette a été supprimée." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la dette." });
    }
  };

  const openHistoryModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsHistoryOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline flex items-center gap-3">
            <HandCoins className="h-8 w-8 text-primary" />
            Gestion des Dettes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suivi des créances clients, des échéances et enregistrement des versements.
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Ajouter une dette
        </Button>
      </div>

      {/* 4 Indicateurs Clés (KPIs) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dettes</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalDue.toLocaleString('fr-FR')} <span className="text-xs font-normal">CFA</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Montant total engagé ({debts.length} dette(s))
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm bg-red-50/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restant</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalRemaining.toLocaleString('fr-FR')} <span className="text-xs font-normal">CFA</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              À recouvrer auprès des clients
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dettes en cours</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {activeDebts.length} <span className="text-xs font-normal text-muted-foreground">active(s)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeDebts.reduce((sum, d) => sum + (Number(d.amountRemaining) || 0), 0).toLocaleString('fr-FR')} CFA restants
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dettes Payées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {paidDebts.length} <span className="text-xs font-normal text-muted-foreground">soldée(s)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidDebts.reduce((sum, d) => sum + (Number(d.amountDue) || 0), 0).toLocaleString('fr-FR')} CFA encaissés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registre des créances</CardTitle>
          <CardDescription>
            Consultez les créances en cours, filtrez par statut ou effectuez un versement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher par prénom, nom, téléphone, article..."
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={sortOptions}
            filterBy={filterBy}
            onFilterChange={setFilterBy}
            filterOptions={filterOptions}
            resultCount={resultCount}
            totalCount={totalCount}
            onReset={resetFilters}
            className="mb-4"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Article & Qté</TableHead>
                <TableHead>Montant Dû</TableHead>
                <TableHead>Reste à Payer</TableHead>
                <TableHead>Date / Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground mt-2">Chargement des dettes...</p>
                  </TableCell>
                </TableRow>
              ) : filteredDebts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    Aucune dette trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDebts.map((debt) => (
                  <TableRow key={debt.id} className="group">
                    {/* Client */}
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {debt.firstName} <span className="font-normal">{debt.lastName}</span>
                      </div>
                      <a 
                        href={`tel:${debt.phone}`}
                        className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="h-3 w-3" />
                        {debt.phone}
                      </a>
                    </TableCell>

                    {/* Article & Qté */}
                    <TableCell>
                      <div className="font-medium">{debt.item}</div>
                      <div className="text-xs text-muted-foreground">Qté : {debt.quantity || 1}</div>
                    </TableCell>

                    {/* Montant dû */}
                    <TableCell className="font-semibold">
                      {Number(debt.amountDue).toLocaleString('fr-FR')} CFA
                    </TableCell>

                    {/* Reste à payer */}
                    <TableCell>
                      <span className={`font-bold ${
                        debt.amountRemaining > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {Number(debt.amountRemaining).toLocaleString('fr-FR')} CFA
                      </span>
                      {debt.amountPaid > 0 && (
                        <div className="text-[11px] text-muted-foreground">
                          Payé : {Number(debt.amountPaid).toLocaleString('fr-FR')} CFA
                        </div>
                      )}
                    </TableCell>

                    {/* Date / Échéance */}
                    <TableCell className="text-xs space-y-0.5">
                      <div>Prise : {formatDate(debt.date)}</div>
                      {debt.dueDate && (
                        <div className="text-amber-600 dark:text-amber-400 font-medium">
                          Échéance : {formatDate(debt.dueDate)}
                        </div>
                      )}
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <Badge variant={statusBadgeVariant[debt.status] || "default"}>
                        {debt.status}
                      </Badge>
                    </TableCell>

                    {/* Note */}
                    <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground" title={debt.note || ''}>
                      {debt.note || '-'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {debt.status !== 'Payé' && (
                            <DropdownMenuItem 
                              onClick={() => openPaymentModal(debt)}
                              className="font-medium text-emerald-600 focus:text-emerald-600"
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Enregistrer un paiement
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openHistoryModal(debt)}>
                            <History className="mr-2 h-4 w-4" />
                            Historique des versements
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(debt)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDebt(debt.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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

      {/* MODAL : Ajouter / Modifier une dette */}
      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSaveDebt}>
            <DialogHeader>
              <DialogTitle>
                {selectedDebt ? "Modifier la dette" : "Ajouter une nouvelle dette"}
              </DialogTitle>
              <DialogDescription>
                Remplissez les coordonnées du client et les modalités financières de la créance.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ex: Assane"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ex: Sakho"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: 77 123 45 67"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="item">Article / Objet *</Label>
                  <Input
                    id="item"
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    placeholder="Ex: iPhone 13 Pro"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amountDue">Montant total dû (CFA) *</Label>
                  <Input
                    id="amountDue"
                    type="number"
                    min="0"
                    value={formData.amountDue}
                    onChange={(e) => setFormData({ ...formData, amountDue: e.target.value })}
                    placeholder="Ex: 250000"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="initialPaid">
                    {selectedDebt ? "Déjà payé (CFA)" : "Acompte immédiat (CFA)"}
                  </Label>
                  <Input
                    id="initialPaid"
                    type="number"
                    min="0"
                    value={formData.initialPaid}
                    onChange={(e) => setFormData({ ...formData, initialPaid: e.target.value })}
                    placeholder="Ex: 50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date de prise</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate">Date d&apos;échéance (optionnelle)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">Remarque / Note (facultatif)</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ex: Complément après échange iPhone 11 contre iPhone 13..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddEditOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  selectedDebt ? "Mettre à jour" : "Créer la dette"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL : Enregistrer un paiement */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[420px]">
          {selectedDebt && (
            <form onSubmit={handleRecordPayment}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Enregistrer un versement
                </DialogTitle>
                <DialogDescription>
                  Client : <span className="font-semibold text-foreground">{selectedDebt.firstName} {selectedDebt.lastName}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg border text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Article :</span>
                    <span className="font-medium">{selectedDebt.item}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant total dû :</span>
                    <span className="font-semibold">{Number(selectedDebt.amountDue).toLocaleString('fr-FR')} CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Déjà versé :</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {Number(selectedDebt.amountPaid || 0).toLocaleString('fr-FR')} CFA
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/50">
                    <span className="font-medium text-foreground">Reste à payer :</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {Number(selectedDebt.amountRemaining).toLocaleString('fr-FR')} CFA
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paymentAmount">Montant versé (CFA) *</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="1"
                    max={selectedDebt.amountRemaining}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Max: ${selectedDebt.amountRemaining}`}
                    required
                    autoFocus
                  />
                  {paymentAmount && Number(paymentAmount) > 0 && (
                    <div className="text-xs text-muted-foreground flex justify-between pt-1">
                      <span>Nouveau reste après ce versement :</span>
                      <span className="font-bold text-foreground">
                        {Math.max(0, selectedDebt.amountRemaining - Number(paymentAmount)).toLocaleString('fr-FR')} CFA
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paymentNote">Note ou mode de paiement (optionnel)</Label>
                  <Input
                    id="paymentNote"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Ex: Wave, Espèces, Orange Money..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    "Valider le versement"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL : Historique des versements d'une dette */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedDebt && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Versements de {selectedDebt.firstName} {selectedDebt.lastName}
                </DialogTitle>
                <DialogDescription>
                  Détail de tous les paiements enregistrés pour l&apos;article {selectedDebt.item}.
                </DialogDescription>
              </DialogHeader>

              <div className="py-3 space-y-3">
                <div className="flex justify-between items-center text-sm p-3 bg-muted/40 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground block">Total dû</span>
                    <span className="font-bold">{Number(selectedDebt.amountDue).toLocaleString('fr-FR')} CFA</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Total versé</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(selectedDebt.amountPaid || 0).toLocaleString('fr-FR')} CFA
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Reste</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {Number(selectedDebt.amountRemaining).toLocaleString('fr-FR')} CFA
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                  {!selectedDebt.payments || selectedDebt.payments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Aucun versement enregistré pour le moment.
                    </p>
                  ) : (
                    selectedDebt.payments.map((p, idx) => (
                      <div key={p.id || idx} className="flex items-center justify-between p-2.5 rounded border bg-card text-xs">
                        <div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                            +{Number(p.amount).toLocaleString('fr-FR')} CFA
                          </span>
                          {p.note && <p className="text-muted-foreground mt-0.5">{p.note}</p>}
                        </div>
                        <div className="text-muted-foreground text-right">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(p.date)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
