(function () {
  const base = {
    id: "christian-sephora-2026",
    slug: "christian-sephora-2026",
    accessKey: "HE-CLSM-2026",
    coupleNames: "Christian Lengbe et Sephora Malanda",
    title: "Leur grande promesse",
    dateIso: "",
    dateLabel: "Date et lieu à confirmer avec le client",
    intro:
      "Avec beaucoup d'affection et une vraie intention de partage, Christian Lengbe et Sephora Malanda vous ouvrent les portes de leur journée la plus précieuse.",
    story:
      "Cette invitation a été pensée comme une expérience plus sensible qu'un simple carton numérique : une lecture élégante, un rythme visuel doux et un ton qui reste intime tout en étant marquant.",
    note:
      "Quand les derniers détails du mariage seront validés, cette base pourra accueillir la vraie date, l'adresse exacte, la table attribuée et le lien personnalisé définitif.",
    venueName: "Lieu de célébration à confirmer",
    venueAddress: "Les informations logistiques seront ajoutées dès validation finale.",
    mapUrl: "https://maps.google.com/?q=Kinshasa",
    ceremonyLabel: "Mariage religieux",
    celebrationLabel: "Réception privée",
    schedule: [
      {
        label: "Accueil des invités",
        time: "Heure à définir",
        note: "Une arrivée fluide, posée et chaleureuse pour installer l'atmosphère."
      },
      {
        label: "Cérémonie religieuse",
        time: "À confirmer",
        note: "Le moment central, pensé pour l'émotion et la solennité."
      },
      {
        label: "Photos & félicitations",
        time: "Ensuite",
        note: "Un temps de retrouvailles, de sourires et de souvenirs partagés."
      },
      {
        label: "Réception & ambiance",
        time: "Plus tard",
        note: "Place à la joie, aux échanges et à la fête dans de belles conditions."
      }
    ],
    palette: {
      base: "#f3e3d5",
      accent: "#b56339",
      accentSoft: "#ebbc98",
      ink: "#2f1d17",
      highlight: "#7a553f"
    },
    coverImage: "/assets/img/mariage.jpeg",
    footerBrand: "Invitation signée Hope Events by Dr Tech",
    whatsappLink: "https://wa.me/243000000000",
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
        "Eau pétillante",
        "Jus d'ananas",
        "Coca-Cola",
        "Fanta",
        "Maltina",
        "Tonic"
      ]
    }
  };

  const invitations = {
    "charite-couple-lonkeke": {
      token: "charite-couple-lonkeke",
      guestName: "Couple Lonkeke",
      salutation: "Chers Lonkeke",
      seats: 2,
      tableName: "Table Charite",
      tableSlug: "table-charite",
      invitationImage: "/Table charité/couple-lonkeke.jpg",
      exportName: "invitation-couple-lonkeke-charite",
      personalMessage:
        "Votre présence compte sincèrement pour Christian et Sephora, et ils seraient très heureux de vous voir partager cette journée avec eux."
    },
    "confiance-couple-kuanzambi": {
      token: "confiance-couple-kuanzambi",
      guestName: "Couple Kuanzambi",
      salutation: "Chers Kuanzambi",
      seats: 2,
      tableName: "Table Confiance",
      tableSlug: "table-confiance",
      invitationImage: "/Table confiance/couple-kuanzambi.jpg",
      exportName: "invitation-couple-kuanzambi-confiance",
      personalMessage:
        "Votre présence compte sincèrement pour Christian et Sephora, et ils seraient très heureux de vous voir partager cette journée avec eux."
    }
  };

  const invitationIndex = Object.values(invitations).map(function (invitation) {
    return {
      token: invitation.token,
      guestName: invitation.guestName,
      seats: invitation.seats,
      tableName: invitation.tableName,
      url: "./invitation.html?token=" + encodeURIComponent(invitation.token)
    };
  });

  window.HopeEventsDemo = {
    defaultToken: "charite-couple-lonkeke",
    invitationIndex: invitationIndex,
    getEventSpace: function (key) {
      const candidate = String(key || "").trim().replace(/[\s_]+/g, "-");

      if (candidate !== base.accessKey && candidate !== base.slug) {
        return null;
      }

      return {
        id: base.id,
        slug: base.slug,
        accessKey: base.accessKey,
        coupleNames: base.coupleNames,
        dateLabel: base.dateLabel,
        venueName: base.venueName,
        venueAddress: base.venueAddress,
        mapUrl: base.mapUrl,
        invitations: invitationIndex.map(function (item) {
          const invitation = invitations[item.token];

          return {
            token: invitation.token,
            guestName: invitation.guestName,
            tableName: invitation.tableName,
            tableSlug: invitation.tableSlug,
            seats: invitation.seats,
            invitationUrl: item.url
          };
        })
      };
    },
    getInvitation: function (token) {
      const invitation = invitations[token];

      if (!invitation) {
        return null;
      }

      return Object.assign({}, base, invitation);
    }
  };
})();
