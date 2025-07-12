// src/app/admin/exchanges/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Image as ImageIcon, CheckCircle } from "lucide-react";
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


const exchanges = [
  { id: "EXC-001", currentModel: "iPhone 12 Pro", desiredModel: "iPhone 15 Pro", contact: "77 123 45 67", status: "En attente", photoUrl: "https://placehold.co/400x400.png", hint: "iphone back" },
  { id: "EXC-002", currentModel: "iPhone 11", desiredModel: "iPhone 15", contact: "78 987 65 43", status: "Traitée", photoUrl: "https://placehold.co/400x400.png", hint: "iphone front" },
  { id: "EXC-003", currentModel: "iPhone 13 Pro Max", desiredModel: "iPhone 15 Pro Max", contact: "76 555 88 99", status: "En attente", photoUrl: "https://placehold.co/400x400.png", hint: "iphone side" },
];

export default function ExchangesPage() {
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
              {exchanges.map((exchange) => (
                <TableRow key={exchange.id}>
                  <TableCell className="font-medium">{exchange.currentModel}</TableCell>
                  <TableCell>{exchange.desiredModel}</TableCell>
                  <TableCell>
                    <a href={`tel:${exchange.contact}`} className="flex items-center gap-2 hover:underline">
                      <Phone className="h-4 w-4" />
                      {exchange.contact}
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
                        <Image src={exchange.photoUrl} alt={`Photo de ${exchange.currentModel}`} data-ai-hint={exchange.hint} width={400} height={400} className="rounded-md mx-auto" />
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
