# Hope Events - Structure Firestore

## 1. Collection `events`

Chaque evenement a un document.

Exemple d'ID de document:

`christian-sephora-2026`

Exemple de contenu:

```json
{
  "accessKey": "HE-CLSM-2026",
  "slug": "christian-sephora-2026",
  "eventId": "christian-sephora-2026",
  "coupleNames": "Christian Lengbe et Sephora Malanda",
  "title": "Invitation privee",
  "dateLabel": "Date et lieu a confirmer",
  "ceremonyLabel": "Mariage religieux",
  "celebrationLabel": "Reception privee",
  "venueName": "Lieu a confirmer",
  "venueAddress": "Informations a confirmer",
  "mapUrl": "https://maps.google.com/?q=Kinshasa",
  "coverImage": "/assets/img/Home.jpg",
  "footerBrand": "Hope Events by Dr Tech",
  "whatsappLink": "https://wa.me/243827274226"
}
```

## 2. Collection `invitations`

Chaque invite a un document.

Exemple d'ID de document:

`table-charite-couple-lonkeke`

Exemple de contenu:

```json
{
  "eventId": "christian-sephora-2026",
  "guestName": "Couple Lonkeke",
  "tableName": "Table Charite",
  "tableSlug": "table-charite",
  "token": "table-charite-couple-lonkeke",
  "seats": 2,
  "isActive": true,
  "exportName": "invitation-couple-lonkeke-charite",
  "invitationImage": "/invitations/table-charite/couple-lonkeke.jpg"
}
```

## 3. Regles de nommage

### `accessKey`

- Sert pour l'acces prive du marie
- Format recommande: `HE-CLSM-2026`
- Pas d'accent
- Pas d'espace
- Utiliser des tirets

### `tableSlug`

- Toujours minuscule
- Pas d'accent
- Pas d'espace
- Ex: `table-charite`

### `token`

- Toujours unique
- Regle recommandee:
  - `tableSlug` + `-` + `guestSlug`
- Ex:
  - `table-charite-couple-lonkeke`
  - `table-confiance-couple-kuanzambi`

## 4. Regle image

Pour eviter les problemes de lien, prefere ce dossier:

`public/invitations/table-charite/couple-lonkeke.jpg`

Puis dans Firestore:

`/invitations/table-charite/couple-lonkeke.jpg`

Evite pour la suite:

- les accents dans les noms de dossier
- les espaces dans les noms de dossier

## 5. Ce qui doit etre tape sur l'accueil

Le marie tape:

`HE-CLSM-2026`

Le site ouvre ensuite:

`/espace-client?key=HE-CLSM-2026`
