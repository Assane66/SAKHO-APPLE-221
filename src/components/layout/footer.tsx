import Link from "next/link";
import { Smartphone, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Link href="/" className="flex items-center space-x-2">
              <Smartphone className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold font-headline">Khalil Apple</span>
            </Link>
            <p className="text-sm">
              Votre expert iPhone au Sénégal. Qualité et service garantis.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold font-headline">Navigation</h4>
            <ul className="space-y-1">
              <li><Link href="/exchange" className="text-sm hover:underline">Échange</Link></li>
              <li><Link href="#" className="text-sm hover:underline">Nos Produits</Link></li>
              <li><Link href="#" className="text-sm hover:underline">Qui sommes-nous?</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold font-headline">Contact</h4>
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>Dakar, Sénégal</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a href="tel:+221784513633" className="hover:underline">+221 78 451 36 33</a>
                </div>
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <a href="mailto:khalilapple778@icloud.com" className="hover:underline">khalilapple778@icloud.com</a>
                </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold font-headline">Suivez-nous</h4>
            {/* Placeholder for social links */}
            <div className="flex space-x-4">
                <Link href="#" aria-label="Facebook page"><span className="text-sm hover:underline">Facebook</span></Link>
                <Link href="#" aria-label="Instagram page"><span className="text-sm hover:underline">Instagram</span></Link>
                <Link href="#" aria-label="Twitter page"><span className="text-sm hover:underline">Twitter</span></Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Khalil Apple. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
