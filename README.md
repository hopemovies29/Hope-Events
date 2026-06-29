# Hope Events Invitations

Base locale pour creer une vitrine `Hope Events` et des invitations privees par lien avec `HTML`, `CSS`, `JavaScript`, `Vercel` et `Firebase`.

## Ce que contient le projet

- une page d'accueil courte, premium et orientee devis
- une page d'invitation unique pilotee par `token`
- un mode demo local pour tester sans Firebase
- des endpoints Vercel prets pour Firestore
- une structure compatible avec Firebase Storage pour les images d'invitation

## Lancer le projet

### Option inspiration locale

Ouvre [public/index.html](./public/index.html) avec Live Server ou un serveur statique.

Exemples de liens de demo :

- `public/invitation.html?token=charite-couple-lonkeke`
- `public/invitation.html?token=confiance-couple-kuanzambi`

### Option proche de la production

1. Installer les dependances avec `npm install`
2. Lancer `npm run dev`
3. Ouvrir `http://localhost:3000`

Avec `vercel dev`, tu peux tester :

- `http://localhost:3000/invitation/charite-couple-lonkeke`
- `http://localhost:3000/invitation/confiance-couple-kuanzambi`

## Structure

```text
public/
  index.html
  invitation.html
  assets/
    css/
    js/
api/
lib/
data/
```

## Variables d'environnement Vercel

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
FIREBASE_EVENTS_COLLECTION=events
FIREBASE_INVITATIONS_COLLECTION=invitations
FIREBASE_GUESTBOOK_COLLECTION=guestbook_messages
FIREBASE_PREFERENCES_COLLECTION=preference_submissions
```

## Structure Firebase recommandee

### Collection `events`

Un document par evenement.

Exemple `events/christian-sephora-2026` :

```json
{
  "slug": "christian-sephora-2026",
  "coupleNames": "Christian Lengbe et Sephora Malanda",
  "dateLabel": "Date et lieu a confirmer",
  "mapUrl": "https://maps.google.com/?q=Kinshasa",
  "footerBrand": "Invitation signee Hope Events by Dr Tech",
  "whatsappLink": "https://wa.me/243000000000"
}
```

### Collection `invitations`

Un document par code invite.

Exemple `invitations/charite-couple-lonkeke` :

```json
{
  "eventId": "christian-sephora-2026",
  "guestName": "Couple Lonkeke",
  "tableName": "Table Charite",
  "tableSlug": "table-charite",
  "invitationStoragePath": "invitations/table-charite/couple-lonkeke.jpg",
  "exportName": "invitation-couple-lonkeke-charite",
  "isActive": true
}
```

Le champ `invitationStoragePath` est ideal si l'image est stockee dans Firebase Storage.

Tu peux aussi stocker directement un lien public avec :

```json
{
  "invitationImage": "https://..."
}
```

### Collection `guestbook_messages`

Pour les messages laisses aux maries.

### Collection `preference_submissions`

Pour les preferences de boissons ou autres choix.

## Structure Storage recommandee

```text
invitations/
  table-charite/
    couple-lonkeke.jpg
  table-confiance/
    couple-kuanzambi.jpg
```

## Logique du projet

- la home ne montre aucun travail client prive
- le client entre un code unique
- l'API `/api/invitation?token=...` lit Firestore
- si une image est dans Storage, le serveur genere une URL signee temporaire
- `invitation.html` charge alors l'image personnalisee du bon couple
