import { ExchangeForm } from '@/components/exchange-form';

export default function ExchangePage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 md:px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
          Estimez la valeur de votre ancien iPhone
        </h1>
        <p className="text-muted-foreground md:text-xl">
          Remplissez le formulaire ci-dessous pour recevoir une estimation de reprise pour votre appareil. C'est simple, rapide et basé sur l'IA.
        </p>
      </div>
      <div className="mt-12">
        <ExchangeForm />
      </div>
    </div>
  );
}
