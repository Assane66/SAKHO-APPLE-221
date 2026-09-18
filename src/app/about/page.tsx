// src/app/about/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="public-surface px-4 py-12 md:px-8 md:py-20">
      <Card className="public-panel mx-auto max-w-4xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline text-center">
            Qui sommes-nous ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-lg text-muted-foreground">
          <p>
            Bienvenue chez <strong translate="no">Khalil Apple</strong>, votre boutique en ligne spécialisée dans la vente d’iPhones, smartphones et accessoires mobiles. Nous sommes une équipe de vendeurs dévoués, passionnés par le service client et par la qualité des produits que nous proposons.
          </p>
          <p>
            Depuis notre création, notre priorité est de vous offrir des produits authentiques, fiables, et à des prix compétitifs. Nous mettons tout en œuvre pour vous accompagner dans vos achats, répondre à vos questions, et vous assurer une expérience simple et agréable.
          </p>
          <p>
            Chez <strong translate="no">Khalil Apple</strong>, nous croyons que chaque client mérite un service personnalisé et attentif. Notre équipe est à votre écoute pour vous conseiller et vous aider à trouver le produit qui correspond le mieux à vos besoins.
          </p>
          <p>
            Notre mission est de faciliter l’accès aux meilleures marques de smartphones et accessoires au Sénégal et dans toute la région, en garantissant la transparence, la confiance et la satisfaction.
          </p>
          <p className="font-semibold text-foreground text-center pt-4">
            Merci de nous faire confiance et de choisir <span translate="no">Khalil Apple</span> pour vos achats mobiles !
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
