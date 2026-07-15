(function () {
  const pageConfig = window.HopeEventsPageConfig || {};

  function isFileMode() {
    return window.location.protocol === "file:";
  }

  function resolveToken() {
    const url = new URL(window.location.href);
    return url.searchParams.get("token") || pageConfig.defaultToken || "amour-couple-kuanzambi";
  }

  function buildPublicInvitationUrl(token, hash) {
    const encoded = encodeURIComponent(token);
    const configuredPath = String(pageConfig.publicInvitationPath || "/couple-lumu/invitation.html").trim();
    const normalizedPath = configuredPath.startsWith("/") ? configuredPath : `/${configuredPath}`;
    const publicBaseUrl = String(pageConfig.publicBaseUrl || "https://hope-events.vercel.app").trim().replace(/\/+$/, "");
    const suffix = hash ? `#${hash}` : "";

    if (!isFileMode()) {
      return `${window.location.origin}${normalizedPath}?token=${encoded}${suffix}`;
    }

    return `${publicBaseUrl}${normalizedPath}?token=${encoded}${suffix}`;
  }

  function buildLocalInvitationUrl(token, hash) {
    const suffix = hash ? `#${hash}` : "";
    return `./invitation.html?token=${encodeURIComponent(token)}${suffix}`;
  }

  function buildQrUrl(url) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&data=${encodeURIComponent(url)}`;
  }

  function splitDateLabel(label) {
    const clean = String(label || "").trim();

    if (!clean) {
      return {
        weekday: "Vendredi",
        date: "7 août 2026"
      };
    }

    const parts = clean.split(/\s+/);

    if (parts.length <= 1) {
      return {
        weekday: clean,
        date: ""
      };
    }

    return {
      weekday: parts.shift(),
      date: parts.join(" ")
    };
  }

  function formatVenueAddress(value) {
    const clean = String(value || "").trim();

    if (!clean) {
      return "Saint-Sacrement\nKinshasa, RDC";
    }

    return clean
      .replace(/\s*,\s*/g, "\n")
      .replace(/\s+-\s+/g, "\n");
  }

  function setText(id, value) {
    const node = document.getElementById(id);

    if (node) {
      node.textContent = value || "";
    }
  }

  function applyInvitation(invitation) {
    const dateBits = splitDateLabel(invitation.dateLabel);
    const venueAddress = formatVenueAddress(invitation.venueAddress);

    setText(
      "guestChip",
      `${invitation.guestName || "Invité"}${invitation.tableName ? ` • ${invitation.tableName}` : ""}`
    );
    setText("qrCoupleNames", invitation.coupleNames || "Ben & Julie");
    setText("qrWeekday", dateBits.weekday || "Vendredi");
    setText("qrDateLabel", dateBits.date || invitation.dateLabel || "7 août 2026");
    setText("qrTimeLabel", invitation.timeLabel || "19h00");
    setText("qrVenueName", invitation.venueName || "Salle Emmaüs,");
    setText("qrVenueAddress", venueAddress);
    setText(
      "qrCallout",
      invitation.qrCallout || "Pour accéder à l’invitation et confirmer votre présence"
    );
    setText(
      "qrPhrase",
      invitation.eventPhrase ||
        "Une belle histoire se poursuit, soyez à nos côtés pour écrire avec nous le prochain chapitre de notre amour."
    );

    document.title = `Carte QR | ${invitation.coupleNames || "Invitation"} | ${invitation.guestName || "Invité"}`;
  }

  async function copyToClipboard(text, trigger, successLabel) {
    try {
      await navigator.clipboard.writeText(text);

      if (trigger) {
        const previous = trigger.innerHTML;
        trigger.textContent = successLabel;

        window.setTimeout(function () {
          trigger.innerHTML = previous;
        }, 1800);
      }
    } catch (error) {
      window.alert(text);
    }
  }

  function initInteractiveLinks(token) {
    const publicUrl = buildPublicInvitationUrl(token);
    const publicRsvpUrl = buildPublicInvitationUrl(token, "rsvp");
    const localUrl = buildLocalInvitationUrl(token);
    const localRsvpUrl = buildLocalInvitationUrl(token, "rsvp");
    const inviteUrl = isFileMode() ? localUrl : publicUrl;
    const rsvpUrl = isFileMode() ? localRsvpUrl : publicRsvpUrl;

    const qrImage = document.getElementById("qrImage");
    const openInviteButton = document.getElementById("openInviteButton");
    const openRsvpButton = document.getElementById("openRsvpButton");
    const shareCardButton = document.getElementById("shareCardButton");
    const focusQrButton = document.getElementById("focusQrButton");
    const copyLinkButton = document.getElementById("copyLinkButton");
    const printCardButton = document.getElementById("printCardButton");
    const qrFocusTarget = document.getElementById("qrFocusTarget");

    if (qrImage) {
      qrImage.src = buildQrUrl(publicUrl);
    }

    if (openInviteButton) {
      openInviteButton.href = inviteUrl;
    }

    if (openRsvpButton) {
      openRsvpButton.href = rsvpUrl;
    }

    if (focusQrButton && qrFocusTarget) {
      focusQrButton.addEventListener("click", function () {
        qrFocusTarget.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "center"
        });

        qrFocusTarget.classList.add("is-highlighted");

        window.setTimeout(function () {
          qrFocusTarget.classList.remove("is-highlighted");
        }, 1400);
      });
    }

    if (shareCardButton) {
      shareCardButton.addEventListener("click", async function () {
        try {
          if (navigator.share) {
            await navigator.share({
              title: "Invitation de mariage",
              text: "Ben et Julie vous invitent à leur mariage.",
              url: publicUrl
            });
            return;
          }

          await copyToClipboard(publicUrl);
          shareCardButton.classList.add("is-active");

          window.setTimeout(function () {
            shareCardButton.classList.remove("is-active");
          }, 1200);
        } catch (error) {
          window.alert(publicUrl);
        }
      });
    }

    if (copyLinkButton) {
      copyLinkButton.addEventListener("click", function () {
        copyToClipboard(publicUrl, copyLinkButton, "Lien copié");
      });
    }

    if (printCardButton) {
      printCardButton.addEventListener("click", function () {
        window.print();
      });
    }
  }

  async function init() {
    const token = resolveToken();
    initInteractiveLinks(token);

    try {
      if (window.HopeEventsApi && typeof window.HopeEventsApi.getInvitation === "function") {
        const payload = await window.HopeEventsApi.getInvitation(token);

        if (payload && payload.data) {
          applyInvitation(payload.data);
          return;
        }
      }
    } catch (error) {
      window.console.warn("Chargement API indisponible pour la carte QR.", error);
    }

    if (window.HopeEventsDemo && typeof window.HopeEventsDemo.getInvitation === "function") {
      const invitation = window.HopeEventsDemo.getInvitation(token);

      if (invitation) {
        applyInvitation(invitation);
      }
    }
  }

  init();
})();
