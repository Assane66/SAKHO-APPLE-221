# Mise à jour des règles Firestore

## Nouvelle collection : `stock`

Pour gérer les IMEI et le stock unique des iPhones, vous devez ajouter les règles Firestore suivantes :

```javascript
// Ajouter cette section à votre firestore.rules

match /stock/{document=**} {
  // Les administrateurs peuvent lire et écrire
  allow read, write: if request.auth != null && request.auth.token.admin == true;
  
  // Les utilisateurs non-authentifiés ne peuvent pas accéder
  allow read, write: if false;
}
```

## Structure de la collection `stock`

Chaque document dans la collection `stock` a la structure suivante :

```typescript
{
  productId: string;           // ID du produit Firebase
  productName: string;         // Nom du produit (ex: "iPhone 15 Pro")
  imei: string;               // IMEI unique de l'appareil
  storage: string;            // Capacité (ex: "128GB")
  status: 'available' | 'sold'; // Statut du stock
  addedAt: Timestamp;         // Date d'ajout au stock
  soldAt?: Timestamp;         // Date de vente (si vendu)
  customerName?: string;      // Nom du client (si vendu)
  customerPhone?: string;     // Téléphone du client (si vendu)
}
```

## Fonctionnalités implémentées

1. **Scanner QR Code** : Scannez le QR code de l'iPhone pour identifier rapidement l'IMEI
2. **Gestion du Stock** : Ajoutez des iPhones au stock avec leur IMEI unique
3. **Vente en Boutique** : Enregistrez les ventes directes avec le nom et téléphone du client
4. **Recherche** : Recherchez par IMEI, modèle ou nom de client
5. **Marquage "Gérer par IMEI"** : Cochez cette option lors de la création d'un produit pour activer la gestion par IMEI

## Utilisation

### Admin
1. Allez à **Admin > Stock (IMEI)**
2. Cliquez sur **Scanner QR Code** pour scanner un iPhone
3. Ou cliquez sur **Ajouter au stock** pour ajouter manuellement
4. Quand un client achète, cliquez sur **Vendre** et entrez ses informations

### Création de produit
Cochez l'option **"Gérer par IMEI (Stock unique)"** lors de la création d'un produit iPhone pour activer la gestion par IMEI.
