// src/app/admin/exchanges/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Image as ImageIcon, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, DocumentData, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useAdminNotifications } from '@/context/AdminNotificationContext';

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { clearNewExchanges } = useAdminNotifications();

  useEffect(() => {
    const q = query(collection(db, "exchanges"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const exchangesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        exchangesData.push({ id: doc.id, ...doc.data() });
      });
      setExchanges(exchangesData);
      setIsLoading(false);
      clearNewExchanges(); // Marquer les échanges comme vus
    });

    return () => unsubscribe();
  }, [clearNewExchanges]);

  const handleMarkAsProcessed = async (id: string) => {
    try {
      await updateDoc(doc(db, "exchanges", id), { status: "Traitée" });
      toast({ title: "Succès", description: "La demande a été marquée comme traitée." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour la demande." });
    }
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Demandes d'échange</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Demandes d'échange des clients</CardTitle>
          <CardDescription>Examinez les demandes de reprise envoyées par les clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Téléphone actuel</TableHead>
                <TableHead>Téléphone souhaité</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Photos</TableHead>
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
              ) : exchanges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aucune demande d'échange pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                exchanges.map((exchange) => (
                  <TableRow key={exchange.id}>
                    <TableCell>
                      {exchange.createdAt?.seconds ? new Date(exchange.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{exchange.currentModel}</TableCell>
                    <TableCell>{exchange.desiredModel}</TableCell>
                    <TableCell>
                      <a href={`tel:${exchange.contactPhone}`} className="flex items-center gap-2 hover:underline">
                        <Phone className="h-4 w-4" />
                        {exchange.contactPhone}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm" disabled={!exchange.photoDataUris || exchange.photoDataUris.length === 0}>
                             <ImageIcon className="mr-2 h-4 w-4" />
                             Voir ({exchange.photoDataUris?.length || 0})
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Photos pour {exchange.currentModel}</DialogTitle>
                             <DialogDescription>
                              Photos fournies par le client pour la demande d'échange.
                            </DialogDescription>
                          </DialogHeader>
                           <Carousel className="w-full max-w-xs mx-auto">
                              <CarouselContent>
                                {exchange.photoDataUris?.map((uri: string, index: number) => (
                                  <CarouselItem key={index}>
                                      <Image src={uri} alt={`Photo de ${exchange.currentModel} - ${index + 1}`} width={400} height={400} className="rounded-md mx-auto aspect-square object-contain" />
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious />
                              <CarouselNext />
                            </Carousel>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Badge variant={exchange.status === 'Traitée' ? 'default' : 'secondary'}>
                        {exchange.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {exchange.status !== 'Traitée' && (
                        <Button size="sm" onClick={() => handleMarkAsProcessed(exchange.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marquer comme traitée
                        </Button>
                      )}
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
