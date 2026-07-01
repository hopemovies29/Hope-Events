const demoEvent = {
  id: "christian-sephora-2026",
  slug: "christian-sephora-2026",
  accessKey: "HE-CLSM-2026",
  coupleNames: "Christian Lengbe et Sephora Malanda",
  title: "Leur grande promesse",
  dateIso: "",
  dateLabel: "Date et lieu a confirmer avec le client",
  intro:
    "Avec beaucoup d'affection et une vraie intention de partage, Christian Lengbe et Sephora Malanda vous ouvrent les portes de leur journee la plus precieuse.",
  story:
    "Cette invitation a ete pensee comme une experience plus sensible qu'un simple carton numerique : une lecture elegante, un rythme visuel doux et un ton qui reste intime tout en etant marquant.",
  note:
    "Quand les derniers details du mariage seront valides, cette base pourra accueillir la vraie date, l'adresse exacte, la table attribuee et le lien personnalise definitif.",
  venueName: "Lieu de celebration a confirmer",
  venueAddress: "Les informations logistiques seront ajoutees des que la validation finale sera faite.",
  mapUrl: "https://maps.google.com/?q=Kinshasa",
  ceremonyLabel: "Mariage religieux",
  celebrationLabel: "Reception privee",
  schedule: [
    {
      label: "Accueil des invites",
      time: "Heure a definir",
      note: "Une arrivee fluide, posee et chaleureuse pour installer l'atmosphere."
    },
    {
      label: "Ceremonie religieuse",
      time: "A confirmer",
      note: "Le moment central, pense pour l'emotion et la solennite."
    },
    {
      label: "Photos et felicitations",
      time: "Ensuite",
      note: "Un temps de retrouvailles, de sourires et de souvenirs partages."
    },
    {
      label: "Reception et ambiance",
      time: "Plus tard",
      note: "Place a la joie, aux echanges et a la fete dans de belles conditions."
    }
  ],
  palette: {
    base: "#f3e3d5",
    accent: "#b56339",
    accentSoft: "#ebbc98",
    ink: "#2f1d17",
    highlight: "#7a553f"
  },
  coverImage: "/assets/img/Home.jpg",
  footerBrand: "Invitation signee Hope Events by Dr Tech",
  whatsappLink: "https://wa.me/243827274226",
  preferences: {
    alcoholic: [
      "Champagne",
      "Vin rouge",
      "Vin blanc",
      "Mojito",
      "Castel",
      "Primus"
    ],
    soft: [
      "Eau petillante",
      "Jus d'ananas",
      "Coca-Cola",
      "Fanta",
      "Maltina",
      "Tonic"
    ]
  }
};

const demoInvitations = {
  "charite-couple-lonkeke": {
    token: "charite-couple-lonkeke",
    eventId: demoEvent.id,
    guestName: "Couple Lonkeke",
    salutation: "Chers Lonkeke",
    seats: 2,
    tableName: "Table Charite",
    tableSlug: "table-charite",
    invitationImage: "/Table charité/couple-lonkeke.jpg",
    exportName: "invitation-couple-lonkeke-charite",
    personalMessage:
      "Votre presence compte sincerement pour Christian et Sephora, et ils seraient tres heureux de vous voir partager cette journee avec eux."
  },
  "confiance-couple-kuanzambi": {
    token: "confiance-couple-kuanzambi",
    eventId: demoEvent.id,
    guestName: "Couple Kuanzambi",
    salutation: "Chers Kuanzambi",
    seats: 2,
    tableName: "Table Confiance",
    tableSlug: "table-confiance",
    invitationImage: "/Table confiance/couple-kuanzambi.jpg",
    exportName: "invitation-couple-kuanzambi-confiance",
    personalMessage:
      "Votre presence compte sincerement pour Christian et Sephora, et ils seraient tres heureux de vous voir partager cette journee avec eux."
  }
};

const guestbookMessages = [];
const preferenceSubmissions = [];
const invitationViews = [];

module.exports = {
  demoEvent,
  demoInvitations,
  guestbookMessages,
  preferenceSubmissions,
  invitationViews
};
