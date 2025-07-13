'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Phone, Smartphone, Send, CheckCircle } from 'lucide-react';
import { createExchangeRequest } from './actions';
import Image from 'next/image';

const formSchema = z.object({
  currentModel: z.string().min(3, { message: 'Veuillez entrer le modèle de votre téléphone.' }),
  desiredModel: z.string().min(3, { message: 'Veuillez entrer le modèle que vous souhaitez.' }),
  photos: z.custom<FileList>().refine(files => files?.length > 0, 'Au moins une photo est requise.'),
  contactPhone: z.string().min(9, 'Le numéro de téléphone doit comporter au moins 9 chiffres.'),
});

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export default function ExchangePage() {
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const [fileNames, setFileNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentModel: '',
      desiredModel: '',
      contactPhone: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    try {
      const photoFiles = Array.from(values.photos);
      const photoDataUris = await Promise.all(photoFiles.map(file => toBase64(file)));

      const result = await createExchangeRequest({
        currentModel: values.currentModel,
        desiredModel: values.desiredModel,
        photoDataUris,
        contactPhone: values.contactPhone,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        throw new Error(result.error || "Impossible d'envoyer la demande.");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Nous n'avons pas pu envoyer votre demande. Veuillez réessayer.",
      });
    } finally {
      setIsPending(false);
    }
  }

  if (submitted) {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4 md:px-6 flex justify-center">
            <Card className="w-full max-w-lg text-center">
                 <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="mt-4">Demande envoyée !</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Merci pour votre demande d'échange. Nous avons bien reçu vos informations et un de nos experts vous contactera très prochainement par téléphone pour finaliser les détails.
                    </p>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                     <Button onClick={() => {
                         setSubmitted(false);
                         form.reset();
                         setFileNames([]);
                     }}>
                        Faire une autre demande
                     </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }


  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
          Faire une demande d'échange
        </h1>
        <p className="text-muted-foreground md:text-xl">
          Remplissez le formulaire ci-dessous et nous vous contacterons pour finaliser votre demande de reprise.
        </p>
      </div>
      <Card className="w-full mt-12">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Détails de l'échange</CardTitle>
          <CardDescription>Fournissez les informations sur votre appareil pour obtenir une offre.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="currentModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone actuel</FormLabel>
                       <FormControl>
                        <Input placeholder="Ex: iPhone 13 Pro Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desiredModel"
                  render={({ field }) => (
                     <FormItem>
                      <FormLabel>Téléphone souhaité</FormLabel>
                       <FormControl>
                        <Input placeholder="Ex: iPhone 15 Pro Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="photos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photos de votre téléphone</FormLabel>
                    <FormControl>
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {fileNames.length > 0 ? `${fileNames.length} image(s) sélectionnée(s)` : "Cliquez pour télécharger (plusieurs possibles)"}
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            field.onChange(files);
                            if (files && files.length > 0) {
                              setFileNames(Array.from(files).map(f => f.name));
                            } else {
                              setFileNames([]);
                            }
                          }}
                        />
                      </>
                    </FormControl>
                     {fileNames.length > 0 && (
                        <div className="text-xs text-muted-foreground pt-1">
                            Fichiers : {fileNames.join(', ')}
                        </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de téléphone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="tel" placeholder="Ex: 77 123 45 67" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer la demande
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
