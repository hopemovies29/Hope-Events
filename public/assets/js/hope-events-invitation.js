(function () {
  let currentInvitation = null;
  let countdownTimer = null;
  const pageConfig = window.HopeEventsPageConfig || {};

  function isFileMode() {
    return window.location.protocol === "file:";
  }

  function resolveToken() {
    const url = new URL(window.location.href);
    const queryToken = url.searchParams.get("token") || url.searchParams.get("code");

    if (queryToken) {
      return queryToken;
    }

    const parts = window.location.pathname.split("/").filter(Boolean);
    const invitationIndex = parts.indexOf("invitation");

    if (invitationIndex !== -1 && parts[invitationIndex + 1]) {
      return decodeURIComponent(parts[invitationIndex + 1]);
    }

    if (pageConfig.defaultToken) {
      return pageConfig.defaultToken;
    }

    if (window.HopeEventsDemo && window.HopeEventsDemo.defaultToken) {
      return window.HopeEventsDemo.defaultToken;
    }

    return "";
  }

  function resolveAssetPath(path) {
    if (!path) {
      return "";
    }

    if (isFileMode() && path.startsWith("/")) {
      return "." + path;
    }

    return path;
  }

  function slugify(value) {
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function extractExtension(path) {
    const cleanPath = (path || "").split("?")[0];
    const match = cleanPath.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : "jpg";
  }

  function setText(id, value, fallback) {
    const node = document.getElementById(id);

    if (!node) {
      return;
    }

    node.textContent = value || fallback || "";
  }

  function setFeedback(id, message, isError) {
    const node = document.getElementById(id);

    if (!node) {
      return;
    }

    node.textContent = message || "";
    node.style.color = isError ? "#ffb9b0" : "#d9c18f";
  }

  function applyPalette(palette) {
    if (!palette) {
      return;
    }

    const root = document.documentElement;

    if (palette.accent) {
      root.style.setProperty("--accent", palette.accent);
    }

    if (palette.highlight) {
      root.style.setProperty("--accent-strong", palette.highlight);
    }
  }

  function buildPublicInvitationUrl(invitation) {
    const token = invitation && invitation.token ? invitation.token : resolveToken();
    const encodedToken = encodeURIComponent(token);
    const publicBaseUrl = String(invitation && invitation.publicBaseUrl ? invitation.publicBaseUrl : "")
      .trim()
      .replace(/\/+$/, "");
    const configuredPath = String(pageConfig.publicInvitationPath || "").trim();
    const normalizedPath = configuredPath
      ? (configuredPath.startsWith("/") ? configuredPath : `/${configuredPath}`)
      : "/invitation";

    if (!isFileMode()) {
      return `${window.location.origin}${normalizedPath}?token=${encodedToken}`;
    }

    if (publicBaseUrl) {
      return `${publicBaseUrl}${normalizedPath}?token=${encodedToken}`;
    }

    return `https://hope-events.vercel.app${normalizedPath}?token=${encodedToken}`;
  }

  function buildQrImageUrl(targetUrl) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(targetUrl)}`;
  }

  function initInvitationMedia(invitation) {
    const section = document.getElementById("personalCardSection");
    const stage = document.querySelector(".message-stage");
    const messageImage = document.getElementById("messageImage");

    if (!section || !stage || !messageImage || !invitation) {
      return;
    }

    const invitationImage = resolveAssetPath(invitation.invitationImage || "");

    if (!invitationImage) {
      section.classList.add("is-hidden");
      messageImage.removeAttribute("src");
      return;
    }

    section.classList.remove("is-hidden");
    messageImage.src = invitationImage;
    messageImage.alt = invitation.guestName
      ? `Invitation personnalisee Hope Events pour ${invitation.guestName}`
      : "Invitation personnalisee Hope Events";

    stage.dataset.messageImage = invitationImage;
    stage.dataset.invitee = invitation.guestName || "";
    stage.dataset.table = invitation.tableName || "";
    stage.dataset.exportName =
      invitation.exportName ||
      [invitation.guestName, invitation.tableName].map(slugify).filter(Boolean).join("-") ||
      "hope-events-invitation";
  }

  function renderSchedule(schedule) {
    const scheduleList = document.getElementById("scheduleList");

    if (!scheduleList) {
      return;
    }

    if (!Array.isArray(schedule) || !schedule.length) {
      scheduleList.innerHTML = `
        <article class="program-item">
          <strong>Programme a confirmer</strong>
          <span>Bientot</span>
          <p>Les horaires detailles seront ajoutes des validation finale.</p>
        </article>
      `;
      return;
    }

    scheduleList.innerHTML = schedule
      .map(function (item) {
        return `
          <article class="program-item">
            <strong>${item.label || "Temps fort"}</strong>
            <span>${item.time || "A confirmer"}</span>
            <p>${item.note || ""}</p>
          </article>
        `;
      })
      .join("");
  }

  function buildChoiceButton(label, category) {
    return `
      <button
        type="button"
        class="choice-chip"
        data-choice="${label}"
        data-category="${category}"
      >
        ${label}
      </button>
    `;
  }

  function renderPreferences(preferences) {
    const alcoholicRoot = document.getElementById("alcoholicChoices");
    const softRoot = document.getElementById("softChoices");

    if (!alcoholicRoot || !softRoot) {
      return;
    }

    const alcoholic = Array.isArray(preferences && preferences.alcoholic)
      ? preferences.alcoholic
      : [];
    const soft = Array.isArray(preferences && preferences.soft)
      ? preferences.soft
      : [];

    alcoholicRoot.innerHTML = alcoholic.map(function (item) {
      return buildChoiceButton(item, "alcoholic");
    }).join("");

    softRoot.innerHTML = soft.map(function (item) {
      return buildChoiceButton(item, "soft");
    }).join("");
  }

  function updateCountdown(dateIso) {
    const target = dateIso ? new Date(dateIso) : null;

    if (!target || Number.isNaN(target.getTime())) {
      setText("daysValue", "--");
      setText("hoursValue", "--");
      setText("minutesValue", "--");
      setText("secondsValue", "--");
      return;
    }

    const diffMs = target.getTime() - Date.now();
    const clamped = Math.max(diffMs, 0);
    const totalSeconds = Math.floor(clamped / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setText("daysValue", String(days).padStart(2, "0"));
    setText("hoursValue", String(hours).padStart(2, "0"));
    setText("minutesValue", String(minutes).padStart(2, "0"));
    setText("secondsValue", String(seconds).padStart(2, "0"));
  }

  function initCountdown(dateIso) {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }

    updateCountdown(dateIso);

    if (!dateIso) {
      return;
    }

    countdownTimer = window.setInterval(function () {
      updateCountdown(dateIso);
    }, 1000);
  }

  function applyInvitationRecord(invitation) {
    if (!invitation) {
      return;
    }

    currentInvitation = invitation;
    applyPalette(invitation.palette);

    setText(
      "heroKicker",
      invitation.title && invitation.title !== invitation.coupleNames
        ? invitation.title
        : "Vous etes invites au mariage de",
      "Vous etes invites au mariage de"
    );
    setText("heroCoupleNames", invitation.coupleNames, "Invitation privee");
    setText("heroDateLabel", invitation.dateLabel, "Date a confirmer");
    setText("heroTimeLabel", invitation.timeLabel, "Heure a confirmer");
    setText("heroVenueName", invitation.venueName, "Lieu a confirmer");
    setText("heroVenueAddress", invitation.venueAddress, "Informations a confirmer");
    setText("heroPhrase", invitation.eventPhrase, invitation.intro || "");
    setText("storyText", invitation.story, invitation.intro || "");
    setText("loveQuote", invitation.eventPhrase, invitation.intro || "");
    setText("personalMessage", invitation.personalMessage, invitation.note || "");
    setText("footerBrand", invitation.footerBrand, "Invitation signee Hope Events by Dr Tech");
    setText("inviteBadge", invitation.guestName || invitation.title || "Invitation QR");
    setText("qrCallout", invitation.qrCallout, "Scannez ce code pour ouvrir l'invitation.");
    setText("rsvpGuestName", invitation.guestName, "votre nom");
    setText(
      "rsvpSimpleNote",
      invitation.guestName
        ? `Cette confirmation sera enregistree pour ${invitation.guestName}.`
        : "Cette confirmation sera enregistree pour l'invite."
    );

    document.title = invitation.guestName
      ? `Invitation | ${invitation.coupleNames} | ${invitation.guestName}`
      : `Invitation | ${invitation.coupleNames}`;

    const mapButton = document.getElementById("mapButton");
    const whatsappLink = document.getElementById("whatsapp-link");

    if (mapButton && invitation.mapUrl) {
      mapButton.href = invitation.mapUrl;
    }

    if (whatsappLink && invitation.whatsappLink) {
      whatsappLink.href = invitation.whatsappLink;
    }

    renderSchedule(invitation.schedule);
    renderPreferences(invitation.preferences);
    initInvitationMedia(invitation);
    initCountdown(invitation.dateIso);
    initQrCard(invitation);
  }

  function initQrCard(invitation) {
    const shareButton = document.getElementById("shareButton");
    const copyLinkButton = document.getElementById("copyLinkButton");
    const openInviteLink = document.getElementById("openInviteLink");
    const qrPreviewLink = document.getElementById("qrPreviewLink");
    const qrCodeImage = document.getElementById("qrCodeImage");
    const linkPreview = document.getElementById("linkPreview");
    const publicUrl = buildPublicInvitationUrl(invitation);
    const qrImageUrl = buildQrImageUrl(publicUrl);

    if (openInviteLink) {
      openInviteLink.href = publicUrl;
    }

    if (qrPreviewLink) {
      qrPreviewLink.href = publicUrl;
    }

    if (qrCodeImage) {
      qrCodeImage.src = qrImageUrl;
    }

    if (linkPreview) {
      linkPreview.textContent = publicUrl;
    }

    if (copyLinkButton) {
      copyLinkButton.onclick = async function () {
        try {
          await navigator.clipboard.writeText(publicUrl);
          if (linkPreview) {
            linkPreview.textContent = `Lien copie : ${publicUrl}`;
          }
        } catch (error) {
          window.alert(publicUrl);
        }
      };
    }

    if (shareButton) {
      shareButton.onclick = async function () {
        const shareData = {
          title: `Invitation - ${invitation.coupleNames || "Hope Events"}`,
          text: invitation.eventPhrase || invitation.title || "Invitation de mariage",
          url: publicUrl
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
            return;
          }

          await navigator.clipboard.writeText(publicUrl);
          window.alert("Lien copie. Vous pouvez maintenant le partager.");
        } catch (error) {
          window.alert(publicUrl);
        }
      };
    }
  }

  function initScrollAction() {
    const scrollButton = document.getElementById("scrollRsvpButton");
    const target = document.getElementById("rsvp");

    if (!scrollButton || !target) {
      return;
    }

    scrollButton.addEventListener("click", function () {
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    });
  }

  function initDownload() {
    const downloadButton = document.getElementById("downloadButton");
    const stage = document.querySelector(".message-stage");
    const messageImage = document.getElementById("messageImage");

    if (!downloadButton || !stage || !messageImage) {
      return;
    }

    downloadButton.addEventListener("click", function () {
      const imagePath = stage.dataset.messageImage || messageImage.currentSrc || messageImage.src;

      if (!imagePath) {
        return;
      }

      const exportName = stage.dataset.exportName || "hope-events-invitation";
      const extension = extractExtension(imagePath);
      const link = document.createElement("a");

      link.download = `${exportName}.${extension}`;
      link.href = imagePath;
      link.click();
    });
  }

  function initHearts() {
    const container = document.querySelector(".coeur");

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const heartCount = window.innerWidth < 768 ? 10 : 16;
    const heartGlyphs = ["❤", "❤", "❤", "❣", "💕", "💖"];
    const heartColors = [
      "rgba(244, 142, 125, 0.84)",
      "rgba(232, 109, 138, 0.82)",
      "rgba(255, 163, 176, 0.88)",
      "rgba(222, 92, 117, 0.78)"
    ];

    for (let index = 0; index < heartCount; index += 1) {
      const heart = document.createElement("span");
      const glyph = document.createElement("span");
      heart.className = "heart";
      glyph.className = "heart-glyph";
      glyph.textContent = heartGlyphs[Math.floor(Math.random() * heartGlyphs.length)];

      heart.style.left = `${2 + Math.random() * 96}%`;
      heart.style.setProperty("--heart-delay", `${Math.random() * 10}s`);
      heart.style.setProperty("--heart-duration", `${10 + Math.random() * 6}s`);
      heart.style.setProperty("--heart-drift", `${-28 + Math.random() * 56}px`);
      heart.style.setProperty("--heart-sway", `${16 + Math.random() * 34}px`);
      heart.style.setProperty("--heart-tilt", `${-18 + Math.random() * 36}deg`);
      heart.style.setProperty("--heart-size", `${18 + Math.random() * 18}px`);
      heart.style.setProperty("--heart-color", heartColors[Math.floor(Math.random() * heartColors.length)]);
      heart.style.setProperty("--heart-beat-duration", `${1.8 + Math.random() * 1.4}s`);
      heart.appendChild(glyph);
      container.appendChild(heart);
    }
  }

  function initRsvpForm() {
    const button = document.getElementById("rsvpConfirmButton");

    if (!button) {
      return;
    }

    button.addEventListener("click", async function () {
      if (!currentInvitation || !window.HopeEventsApi || typeof window.HopeEventsApi.saveRsvp !== "function") {
        setFeedback("rsvp-feedback", "Le module RSVP est indisponible pour le moment.", true);
        return;
      }

      const guestName = String(currentInvitation.guestName || "").trim() || "Invite";
      const companions = Math.max((Number(currentInvitation.seats) || 1) - 1, 0);

      setFeedback("rsvp-feedback", "Envoi de votre confirmation...", false);
      button.disabled = true;

      try {
        await window.HopeEventsApi.saveRsvp({
          token: currentInvitation.token,
          guestName,
          phone: "",
          attendance: "oui",
          companions,
          note: "Confirmation rapide depuis l'invitation web"
        });

        button.textContent = "Presence confirmee";
        setFeedback("rsvp-feedback", "Votre presence a bien ete enregistree.", false);
      } catch (error) {
        button.disabled = false;
        setFeedback("rsvp-feedback", error.message || "Impossible d'envoyer votre confirmation.", true);
      }
    });
  }

  function initGuestbook() {
    const form = document.getElementById("guestbook-form");

    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!currentInvitation || !window.HopeEventsApi || typeof window.HopeEventsApi.saveGuestbookMessage !== "function") {
        setFeedback("guestbook-feedback", "Le livre d'or est indisponible pour le moment.", true);
        return;
      }

      const author = String(document.getElementById("guestbook-author").value || "").trim();
      const message = String(document.getElementById("message-input").value || "").trim();

      if (!author || message.length < 8) {
        setFeedback("guestbook-feedback", "Veuillez ecrire un message plus complet.", true);
        return;
      }

      setFeedback("guestbook-feedback", "Envoi du message...", false);

      try {
        await window.HopeEventsApi.saveGuestbookMessage({
          token: currentInvitation.token,
          author,
          message
        });

        setFeedback("guestbook-feedback", "Merci, votre mot a bien ete envoye.", false);
        form.reset();
      } catch (error) {
        setFeedback("guestbook-feedback", error.message || "Impossible d'envoyer le message.", true);
      }
    });
  }

  function getSelectedChoices() {
    return Array.from(document.querySelectorAll(".choice-chip.active")).map(function (button) {
      return button.getAttribute("data-choice");
    });
  }

  function initPreferences() {
    const preferencesRoot = document.getElementById("preferences");
    const submitButton = document.getElementById("preferences-submit");

    if (!preferencesRoot || !submitButton) {
      return;
    }

    preferencesRoot.addEventListener("click", function (event) {
      const button = event.target.closest(".choice-chip");

      if (!button) {
        return;
      }

      if (button.classList.contains("active")) {
        button.classList.remove("active");
        return;
      }

      const selected = getSelectedChoices();

      if (selected.length >= 2) {
        const firstActive = document.querySelector(".choice-chip.active");

        if (firstActive) {
          firstActive.classList.remove("active");
        }
      }

      button.classList.add("active");
    });

    submitButton.addEventListener("click", async function () {
      if (!currentInvitation || !window.HopeEventsApi || typeof window.HopeEventsApi.savePreferences !== "function") {
        setFeedback("preferences-feedback", "Le module preferences est indisponible.", true);
        return;
      }

      const choices = getSelectedChoices();

      if (!choices.length) {
        setFeedback("preferences-feedback", "Choisissez au moins une boisson.", true);
        return;
      }

      setFeedback("preferences-feedback", "Enregistrement des preferences...", false);

      try {
        await window.HopeEventsApi.savePreferences({
          token: currentInvitation.token,
          guestName: currentInvitation.guestName || "",
          choices
        });

        setFeedback("preferences-feedback", "Vos preferences ont bien ete envoyees.", false);
      } catch (error) {
        setFeedback("preferences-feedback", error.message || "Impossible d'envoyer les preferences.", true);
      }
    });
  }

  async function hydrateInvitationFromApi() {
    const token = resolveToken();

    if (!token || !window.HopeEventsApi || typeof window.HopeEventsApi.getInvitation !== "function") {
      return;
    }

    try {
      const payload = await window.HopeEventsApi.getInvitation(token);

      if (!payload || !payload.data) {
        return;
      }

      applyInvitationRecord(payload.data);

      if (typeof window.HopeEventsApi.recordView === "function") {
        window.HopeEventsApi.recordView(payload.data.token || token).catch(function () {
          return null;
        });
      }
    } catch (error) {
      window.console.warn("Impossible de charger l'invitation dynamique.", error);
    }
  }

  function init() {
    initHearts();
    initScrollAction();
    initDownload();
    initRsvpForm();
    initGuestbook();
    initPreferences();
    hydrateInvitationFromApi();
  }

  init();
})();
