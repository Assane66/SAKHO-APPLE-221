import Link from "next/link";
import { Smartphone, MapPin, Phone, Mail } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface SettingsData {
  shopName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

async function getSettings(): Promise<SettingsData> {
    try {
        const settingsRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            return docSnap.data() as SettingsData;
        }
        return {};
    } catch (error) {
        console.error("Failed to fetch settings for footer:", error);
        return {}; // Return empty object on error
    }
}

export async function Footer() {
  const settings = await getSettings();

  const shopName = settings.shopName || 'Khalil Apple';
  const address = settings.address || 'Dakar, Médine Rue 37 angle 18';
  const contactPhone = settings.contactPhone || '+221 77 075 71 83';
  const contactEmail = settings.contactEmail || 'khalilapple778@icloud.com';


  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Link href="/" className="flex items-center space-x-2">
              <Smartphone className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold font-headline">{shopName}</span>
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
                    <span>{address}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a href={`tel:${contactPhone}`} className="hover:underline">{contactPhone}</a>
                </div>
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <a href={`mailto:${contactEmail}`} className="hover:underline">{contactEmail}</a>
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
          <p>&copy; {new Date().getFullYear()} {shopName}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
