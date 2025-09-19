import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

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
  const address = settings.address || 'Tivaouane Peulh';
  const contactPhone = settings.contactPhone || '+221781395893';
  const contactEmail = settings.contactEmail || 'sakho1555@gmail.com';


  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Link href="/" className="flex items-center space-x-2">
               <Image 
                src="https://res.cloudinary.com/dm6yuokre/image/upload/v1752163215/IMG-20250710-WA0000-removebg-preview_uunwq2.png"
                alt="Khalil Apple Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="text-lg font-bold font-headline" translate="no">{shopName}</span>
            </Link>
            <p className="text-sm">
              Votre expert iPhone au Sénégal. Qualité et service garantis.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold font-headline">Navigation</h4>
            <ul className="space-y-1">
              <li><Link href="/exchange" className="text-sm hover:underline">Échange</Link></li>
              <li><Link href="/products" className="text-sm hover:underline">Nos Produits</Link></li>
              <li><Link href="/about" className="text-sm hover:underline">Qui sommes-nous?</Link></li>
            </ul>
          </div>
            <div className="space-y-2">
                <h4 className="font-semibold font-headline">Contact</h4>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{address}</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${contactPhone}`}>{contactPhone}</a>
                    </li>
                    <li className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                    </li>
                </ul>
            </div>
          <div className="space-y-2">
            <h4 className="font-semibold font-headline">Suivez-nous</h4>
            {/* Placeholder for social links */}
            <div className="flex space-x-4">
                <Link href="https://vm.tiktok.com/ZMHgBjJwjqgsS-ysH6R/" aria-label="TikTok page"><span className="text-sm hover:underline">TikTok</span></Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} <span translate="no">{shopName}</span>. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
