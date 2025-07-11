"use client";

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getTradeInEstimate } from '@/app/exchange/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Phone, Smartphone } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const IPHONE_MODELS = [
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 Mini",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 Mini",
  "iPhone SE (3rd gen)", "iPhone SE (2nd gen)",
  "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
  "Autre modèle"
];

const formSchema = z.object({
  currentModel: z.string({ required_error: 'Veuillez sélectionner le modèle actuel.' }),
  photo: z.custom<FileList>().refine(files => files?.length > 0, 'Une photo est requise.'),
  desiredModel: z.string({ required_error: 'Veuillez sélectionner le modèle désiré.' }),
  contactPhone: z.string().min(9, 'Le numéro de téléphone doit comporter au moins 9 chiffres.'),
});

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export function ExchangeForm() {
  const [isPending, setIsPending] = useState(false);
  const [estimation, setEstimation] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [fileName, setFileName] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactPhone: "",
    },
  });
  
  const photoRef = form.register("photo");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    try {
      const photoFile = values.photo[0];
      const photoDataUri = await toBase64(photoFile);

      const result = await getTradeInEstimate({
        currentModel: values.currentModel,
        photoDataUri,
        desiredModel: values.desiredModel,
        contactPhone: values.contactPhone,
      });

      if (result.success && result.data?.estimatedValue) {
        setEstimation(result.data.estimatedValue);
        setIsDialogOpen(true);
        form.reset();
        setFileName('');
      } else {
        throw new Error(result.error || 'Failed to get estimation');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Nous n'avons pas pu obtenir d'estimation. Veuillez réessayer.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Détails de l'échange</CardTitle>
          <CardDescription>Fournissez les informations sur votre appareil pour obtenir une estimation de sa valeur d'échange.</CardDescription>
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
                      <FormLabel>Modèle à échanger</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <Smartphone className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Sélectionnez votre iPhone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {IPHONE_MODELS.map(model => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desiredModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modèle désiré</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                             <Smartphone className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Sélectionnez un nouvel iPhone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {IPHONE_MODELS.filter(m => m !== 'Autre modèle').map(model => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo de votre iPhone</FormLabel>
                    <FormControl>
                        <Button asChild variant="outline" className="w-full justify-start text-muted-foreground">
                           <div>
                                <Upload className="mr-2 h-4 w-4" />
                                {fileName || "Cliquez pour télécharger une photo"}
                                <input 
                                    type="file" 
                                    className="hidden"
                                    accept="image/*"
                                    {...photoRef}
                                    onChange={(e) => {
                                        field.onChange(e.target.files);
                                        if (e.target.files && e.target.files.length > 0) {
                                            setFileName(e.target.files[0].name);
                                        }
                                    }}
                                />
                           </div>
                        </Button>
                    </FormControl>
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
                    Estimation en cours...
                  </>
                ) : (
                  "Obtenir mon estimation"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Estimation de la valeur d'échange</AlertDialogTitle>
            <AlertDialogDescription>
              Voici une estimation de la valeur de reprise de votre appareil. Un de nos experts vous contactera bientôt pour finaliser l'offre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 bg-secondary rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Valeur estimée</p>
            <p className="text-3xl font-bold text-primary">{estimation}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>Fermer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
