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
import { collection, onSnapshot, query, DocumentData } from 'firebase/firestore';

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Assuming trade-in requests are stored in a collection named 'exchanges'
    // This collection would be populated by your AI flow
    const q = query(collection(db, "exchanges"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const exchangesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        exchangesData.push({ id: doc.id, ...doc.data() });
      });
      setExchanges(exchangesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Demandes d'échange</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Demandes d'échange IA</CardTitle>
          <CardDescription>Examinez les demandes de reprise générées par l'IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modèle à échanger</TableHead>
                <TableHead>Modèle désiré</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Photo</TableHead>
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
              ) : exchanges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Aucune demande d'échange pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                exchanges.map((exchange) => (
                  <TableRow key={exchange.id}>
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
                           <Button variant="outline" size="sm">
                             <ImageIcon className="mr-2 h-4 w-4" />
                             Voir
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Photo de l'{exchange.currentModel}</DialogTitle>
                            <DialogDescription>
                              Photo fournie par le client pour l'estimation.
                            </DialogDescription>
                          </DialogHeader>
                          <Image src={exchange.photoDataUri} alt={`Photo de ${exchange.currentModel}`} width={400} height={400} className="rounded-md mx-auto" />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Badge variant={exchange.status === 'Traitée' ? 'default' : 'secondary'}>
                        {exchange.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {exchange.status === 'En attente' && (
                        <Button size="sm">
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
