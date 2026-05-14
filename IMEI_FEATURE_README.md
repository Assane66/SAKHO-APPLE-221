# Fonctionnalité de Gestion IMEI - sakho-apple

## 📱 Vue d'ensemble

Cette mise à jour ajoute une fonctionnalité complète de gestion des IMEI pour les iPhones, permettant aux administrateurs de :

- **Scanner les QR codes** des iPhones pour identifier rapidement les appareils
- **Gérer un stock unique** d'iPhones avec IMEI spécifique
- **Enregistrer les ventes en boutique** avec les informations client
- **Rechercher rapidement** par IMEI, modèle ou client

## 🎯 Cas d'usage

P'tit Fabien vend des iPhones et souhaite :

1. **Ajouter des iPhones génériques** (XR, 128GB, etc.) que les clients peuvent commander à tout moment
2. **Ajouter des iPhones spécifiques** avec IMEI unique qu'il possède en stock
3. **Scanner les QR codes** pour identifier rapidement un iPhone lors d'une vente en boutique
4. **Enregistrer les ventes** avec le nom et téléphone du client

## 🔧 Modifications apportées

### 1. Types TypeScript (`src/types/index.ts`)

```typescript
export type StockItem = {
  id: string;
  productId: string;
  productName: string;
  imei: string;
  storage: string;
  status: 'available' | 'sold';
  addedAt: any;
  soldAt?: any;
  customerName?: string;
  customerPhone?: string;
};
```

### 2. Composants

#### `src/components/admin/qr-scanner.tsx`
Composant modal pour scanner les QR codes avec la bibliothèque `html5-qrcode`.

#### `src/app/admin/stock/page.tsx`
Page complète de gestion du stock avec :
- Scanner QR Code
- Ajout manuel au stock
- Enregistrement des ventes
- Recherche et filtrage

### 3. Modifications des pages existantes

- **`src/app/admin/products/new/page.tsx`** : Ajout du checkbox "Gérer par IMEI"
- **`src/app/admin/products/[id]/edit/page.tsx`** : Ajout du checkbox "Gérer par IMEI"
- **`src/components/admin/admin-sidebar.tsx`** : Ajout du lien "Stock (IMEI)"

## 📦 Dépendances ajoutées

```json
{
  "html5-qrcode": "^2.3.8"
}
```

## 🚀 Installation et configuration

### 1. Installer les dépendances

```bash
pnpm install html5-qrcode
```

### 2. Mettre à jour les règles Firestore

Consultez `FIRESTORE_RULES_UPDATE.md` pour ajouter les règles de sécurité pour la collection `stock`.

### 3. Redémarrer le serveur de développement

```bash
pnpm dev
```

## 📖 Utilisation

### Pour les administrateurs

#### Accéder à la gestion du stock

1. Allez à **Admin Dashboard**
2. Cliquez sur **Stock (IMEI)** dans la barre latérale

#### Scanner un QR Code

1. Cliquez sur le bouton **Scanner QR Code**
2. Pointez la caméra vers le QR code de l'iPhone
3. Le système identifie automatiquement l'appareil
4. Entrez le nom et téléphone du client
5. Cliquez sur **Confirmer la vente**

#### Ajouter manuellement au stock

1. Cliquez sur **Ajouter au stock**
2. Sélectionnez le produit (ex: iPhone 15 Pro)
3. Sélectionnez la capacité (ex: 128GB)
4. Entrez l'IMEI de l'appareil
5. Cliquez sur **Ajouter au stock**

#### Enregistrer une vente

1. Recherchez l'IMEI dans la liste
2. Cliquez sur le bouton **Vendre**
3. Entrez le nom et téléphone du client
4. Cliquez sur **Confirmer la vente**

### Pour la création de produits

Lors de la création d'un nouveau produit iPhone :

1. Cochez l'option **"Gérer par IMEI (Stock unique)"**
2. Cela indique que ce produit peut avoir des exemplaires avec IMEI unique

## 🔍 Recherche et filtrage

La page de stock permet de rechercher par :
- **IMEI** : Ex: "356789..."
- **Modèle** : Ex: "iPhone 15 Pro"
- **Client** : Ex: "Fabien Diallo"

## 📊 Statuts

- **En stock** : Appareil disponible pour la vente
- **Vendu** : Appareil vendu avec informations client

## 🛡️ Sécurité

- Seuls les administrateurs peuvent accéder à la gestion du stock
- Les clients ne voient pas les IMEI des appareils
- Les informations client sont enregistrées lors de la vente

## 🐛 Dépannage

### Le scanner QR Code ne fonctionne pas

1. Vérifiez que vous avez autorisé l'accès à la caméra
2. Assurez-vous que le QR code est bien visible et lisible
3. Essayez d'ajouter manuellement l'IMEI

### L'IMEI n'est pas trouvé

1. Vérifiez que l'IMEI est correctement saisi
2. Vérifiez que l'appareil a été ajouté au stock
3. Vérifiez que le statut est "En stock"

## 📝 Notes

- Les IMEI doivent être uniques dans le stock
- Un appareil vendu ne peut pas être vendu à nouveau
- Les informations client sont conservées pour les appareils vendus

## 🔄 Prochaines améliorations possibles

- Export des ventes en CSV/PDF
- Rapports de ventes par période
- Historique des modifications
- Notifications automatiques
- Intégration avec système de paiement

## 📞 Support

Pour toute question ou problème, veuillez contacter l'administrateur du site.
