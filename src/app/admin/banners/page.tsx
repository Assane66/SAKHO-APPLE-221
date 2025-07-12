// src/app/admin/banners/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Link as LinkIcon } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const banners = [
  { id: 1, name: "Bannière principale - iPhone 15", imageUrl: "https://placehold.co/300x150.png", hint: "iphone hero", link: "/products/iphone-15", status: "Actif" },
  { id: 2, name: "Promo accessoires", imageUrl: "https://placehold.co/300x150.png", hint: "phone accessory", link: "/categories/accessoires", status: "Actif" },
  { id: 3, name: "Ancienne bannière soldes", imageUrl: "https://placehold.co/300x150.png", hint: "sale banner", link: "#", status: "Inactif" },
];

export default function BannersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Bannières</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une bannière
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des bannières</CardTitle>
          <CardDescription>Ajoutez, supprimez et organisez les bannières promotionnelles de votre site.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aperçu</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Lien</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <Image src={banner.imageUrl} alt={banner.name} data-ai-hint={banner.hint} width={150} height={75} className="rounded-md" />
                  </TableCell>
                  <TableCell className="font-medium">{banner.name}</TableCell>
                  <TableCell>
                    <Link href={banner.link} className="flex items-center gap-2 text-blue-600 hover:underline">
                      <LinkIcon className="h-4 w-4" />
                      {banner.link}
                    </Link>
                  </TableCell>
                  <TableCell>
                     <Badge variant={banner.status === 'Actif' ? 'default' : 'secondary'}>
                      {banner.status}
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
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        <DropdownMenuItem>Désactiver</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
