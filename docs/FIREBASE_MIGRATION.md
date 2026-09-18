# Migration Firebase non destructive

Cette procédure copie les données de `khalil-premium` vers
`sakho-apple-221`. Elle ne supprime et ne modifie jamais le projet source.
L'application continue de pointer vers l'ancien projet tant que la vérification
finale n'est pas validée.

## Pré-requis

- Node.js 20 ou plus récent
- `gcloud` avec `gsutil`
- Firebase CLI : `npx -y firebase-tools@latest --version`
- Accès aux deux projets avec le compte utilisé par Application Default
  Credentials

`firebase login` authentifie la CLI Firebase, mais ne configure pas les
identifiants Application Default utilisés par `firebase-admin`. Dans un
Codespace où `gcloud` n'est pas installé, installez le Google Cloud CLI dans le
terminal, puis ouvrez une nouvelle session shell :

```bash
curl https://sdk.cloud.google.com | bash
exec -l "$SHELL"
gcloud --version
```

Si l'installation par `curl` est bloquée par la politique de votre
environnement, utilisez la procédure officielle adaptée à votre distribution :
https://cloud.google.com/sdk/docs/install

Ne placez jamais de clé de compte de service dans Git. Si vous utilisez des
clés JSON, stockez-les dans un dossier ignoré par Git, par exemple
`firebase-migration-credentials/`.

```bash
gcloud auth login
gcloud auth application-default login
npx -y firebase-tools@latest login
```

Dans `gcloud auth application-default login`, sélectionnez le même compte
Google qui a accès à `khalil-premium` et `sakho-apple-221`. Vérifiez
l'identité avant la migration :

```bash
gcloud auth list
gcloud auth application-default print-access-token >/dev/null \
  && echo "Application Default Credentials: OK"
```

Alternative sans `gcloud` : créez un compte de service avec les permissions
nécessaires dans Google Cloud, téléchargez sa clé JSON hors du dépôt, puis
passez `--credentials=./firebase-migration-credentials/source.json` à
l'export et `--credentials=./firebase-migration-credentials/target.json` à
l'import. Ne partagez jamais ces fichiers et révoquez-les après la migration.

Vérifiez ensuite que le compte a au minimum les permissions d'administrateur
Firestore, Storage et Authentication sur les deux projets.

## 1. Vérifier les bases Firestore

Le script nécessite une base Firestore Standard existante dans chaque projet.
Les commandes suivantes doivent être exécutées après authentification :

```bash
npx -y firebase-tools@latest firestore:databases:list --project=khalil-premium
npx -y firebase-tools@latest firestore:databases:list --project=sakho-apple-221
```

Le script cible la base `(default)`, qui est celle utilisée par l'application.
Si l'un des projets utilise une autre base, adaptez le script avant exécution
et validez la base exacte dans la console Firebase.

## 2. Exporter Firestore depuis la source

L'export conserve les chemins complets des documents et sous-collections,
timestamps, GeoPoints, bytes et références. Les références appartenant au
projet source seront recréées dans le projet cible lors de l'import.

```bash
rm -rf migration-dump
node scripts/firebase-migration/firestore-export.cjs \
  --project=khalil-premium \
  --out=./migration-dump
```

Pour utiliser une clé JSON à la place des ADC :

```bash
node scripts/firebase-migration/firestore-export.cjs \
  --project=khalil-premium \
  --credentials=./firebase-migration-credentials/source.json \
  --out=./migration-dump
```

Inspectez `migration-dump/manifest.json` avant de continuer. Le dossier
contient des données sensibles et est ignoré par Git.

## 3. Importer Firestore dans la cible

Par défaut, le script refuse une cible non vide afin d'éviter un écrasement
accidentel. Il écrit par lots de 400 documents et conserve les IDs exacts.

```bash
node scripts/firebase-migration/firestore-import.cjs \
  --sourceProject=khalil-premium \
  --project=sakho-apple-221 \
  --in=./migration-dump
```

`--allow-non-empty` est volontairement explicite et ne doit être utilisé
qu'après avoir vérifié les collisions :

```bash
node scripts/firebase-migration/firestore-import.cjs \
  --sourceProject=khalil-premium \
  --project=sakho-apple-221 \
  --in=./migration-dump \
  --allow-non-empty
```

## 4. Vérifier chaque document

Cette commande relit les deux projets et compare les chemins et un
empreinte SHA-256 des données de chaque document. Un code de sortie différent
de zéro indique une différence à examiner dans
`migration-dump/verification.json`.

```bash
node scripts/firebase-migration/firestore-verify.cjs \
  --sourceProject=khalil-premium \
  --targetProject=sakho-apple-221 \
  --dump=./migration-dump
```

La comparaison est une validation de contenu, pas une validation des règles
d'accès. Testez aussi les parcours de l'application avec des comptes de test.

## 5. Règles et index

Exportez les configurations sans modifier le projet source, puis relisez les
fichiers avant déploiement :

```bash
npx -y firebase-tools@latest firestore:rules \
  --project=khalil-premium > /tmp/source-firestore.rules
npx -y firebase-tools@latest firestore:indexes \
  --project=khalil-premium > /tmp/source-firestore.indexes.json

cp /tmp/source-firestore.rules firestore.rules
cp /tmp/source-firestore.indexes.json firestore.indexes.json
npx -y firebase-tools@latest deploy \
  --project=sakho-apple-221 \
  --only firestore:rules,firestore:indexes
```

Si la CLI ne fournit pas un export dans votre version, utilisez les boutons
**Publier** / **Exporter** de la console Firebase. Ne remplacez pas les règles
du dépôt sans les relire : elles protègent notamment les utilisateurs et les
commandes.

## 6. Images : Cloudinary conservé

Le dépôt utilise déjà Cloudinary pour les images et les fichiers médias, et non
Firebase Storage. Les URLs existantes utilisent le cloud
`dm6yuokre` et les formulaires d'upload utilisent le preset
`khalil_apple`. Il n'est donc pas nécessaire de copier les images vers le
nouveau projet Firebase : elles resteront disponibles dans le même compte
Cloudinary, avec les mêmes URLs, transformations et ressources.

Avant la bascule, vérifiez dans la console Cloudinary que :

- le cloud `dm6yuokre` est toujours actif ;
- le preset d'upload `khalil_apple` existe et reste autorisé ;
- les URLs Cloudinary enregistrées dans Firestore sont accessibles ;
- les limites et permissions du compte permettent les futurs uploads admin.

La migration Firebase ne modifie pas Cloudinary. Les images référencées par les
documents Firestore copiés continueront donc de fonctionner sans ré-upload.

Si Firebase Storage contient malgré tout des objets utilisés par l'application,
identifiez les buckets réels avant toute copie :

```bash
gcloud storage buckets list --project=khalil-premium
```

Dans ce cas seulement, copiez les objets vers le bucket cible avec
`gcloud storage rsync --recursive` et migrez aussi les règles Storage.

## 7. Firebase Authentication

Les utilisateurs peuvent être exportés/importés, mais les paramètres de hash
doivent être conservés pour permettre la reconnexion avec les mots de passe
existants :

```bash
npx -y firebase-tools@latest auth:export \
  ./migration-dump/users.json \
  --project=khalil-premium \
  --format=json
```

Lisez les paramètres de hash du projet source dans la console Authentication
avant l'import. Fournissez-les à la commande `auth:import` conformément à la
sortie de `firebase help auth:import` :

```bash
npx -y firebase-tools@latest auth:import \
  ./migration-dump/users.json \
  --project=sakho-apple-221 \
  --hash-algo=<algorithme-source> \
  --rounds=<rounds-source> \
  --mem-cost=<mem-cost-source>
```

Ne devinez jamais ces paramètres. Les fournisseurs OAuth sont à revalider dans
la console cible, car leurs secrets et domaines autorisés ne sont pas copiés
par un export d'utilisateurs. Les tokens de session existants ne sont pas
transférables : les utilisateurs devront se reconnecter.

## 8. Bascule de l'application (après validation uniquement)

Cette migration ne modifie volontairement pas
[`src/lib/firebase.ts`](../src/lib/firebase.ts). Après validation des données,
des règles, du Storage et de l'Authentication :

1. remplacez la configuration Firebase de l'application par celle de
   `sakho-apple-221` ;
2. mettez à jour `.firebaserc` et les variables d'environnement concernées ;
3. déployez une prévisualisation ;
4. testez catalogue, stock, IMEI, commandes, administration, images et
   connexion ;
5. seulement ensuite, déployez la version cible en production.

Conservez `migration-dump/` jusqu'à la fin de la période de vérification.
