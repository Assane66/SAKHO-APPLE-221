// src/components/whatsapp-fab.tsx
import Image from 'next/image';
import Link from 'next/link';

export function WhatsAppFAB() {
  const whatsappLink = "https://wa.me/221781395893?text=Bonjour%20et%20bienvenue%20chez%20Khalil%20Apple%20%F0%9F%91%8B%20!%20Comment%20puis-je%20vous%20aider%20%3F";
  const iconUrl = "https://res.cloudinary.com/dm6yuokre/image/upload/v1752163214/Pngtree_whatsapp_icon_whatsapp_logo_3584844_qnvcmv.png";

  return (
    <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className="fixed bottom-5 right-5 z-50 h-16 w-16 transition-transform hover:scale-110">
      <Image
        src={iconUrl}
        alt="Contactez-nous sur WhatsApp"
        width={64}
        height={64}
        className="rounded-full shadow-lg"
      />
    </Link>
  );
}
