import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const products = [
  {
    name: "iPhone 15 Pro",
    description: "Le summum de la technologie.",
    image: "https://placehold.co/600x600.png",
    price: "à partir de 750 000 CFA",
    hint: "iphone front"
  },
  {
    name: "iPhone 15",
    description: "La puissance au quotidien.",
    image: "https://placehold.co/600x600.png",
    price: "à partir de 550 000 CFA",
    hint: "iphone blue"
  },
  {
    name: "iPhone 14 Pro",
    description: "Une performance qui dure.",
    image: "https://placehold.co/600x600.png",
    price: "à partir de 600 000 CFA",
    hint: "iphone back"
  },
  {
    name: "iPhone 13",
    description: "Un classique indémodable.",
    image: "https://placehold.co/600x600.png",
    price: "à partir de 350 000 CFA",
    hint: "iphone side"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Bienvenue chez Khalil Apple
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Votre destination N°1 pour les iPhones neufs et reconditionnés au Sénégal. Découvrez nos offres et estimez la valeur de votre ancien appareil.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/exchange">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Échanger mon iPhone
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Voir les produits
                </Button>
              </div>
            </div>
            <Image
              src="https://placehold.co/600x600.png"
              width="600"
              height="600"
              alt="Hero iPhone"
              data-ai-hint="iphone hero"
              className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Nos iPhones</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Découvrez notre sélection des meilleurs modèles Apple, disponibles en plusieurs configurations pour répondre à tous vos besoins.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-4 md:grid-cols-2">
            {products.map((product) => (
              <Card key={product.name} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="p-0">
                  <Image
                    src={product.image}
                    width={600}
                    height={600}
                    alt={product.name}
                    data-ai-hint={product.hint}
                    className="aspect-square object-cover"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2">Nouveau</Badge>
                  <CardTitle className="text-lg font-headline">{product.name}</CardTitle>
                  <CardDescription className="text-sm">{product.description}</CardDescription>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="flex flex-col w-full">
                    <span className="text-md font-semibold text-primary">{product.price}</span>
                    <Button className="w-full mt-2">
                      Voir les options
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
