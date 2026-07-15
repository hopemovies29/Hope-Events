(function () {
  const rootConfig = window.HopeEventsPageConfig || {};
  const pageConfig = window.HopeEventsGuestQrPageConfig || {};
  const feedbackNode = document.getElementById("guestQrFeedback");
  const posterViewer = document.getElementById("posterViewer");
  const openCardButton = document.getElementById("openCardButton");
  const invitationButton = document.getElementById("openInvitationButton");
  const confirmButton = document.getElementById("confirmPresenceButton");
  const shareButton = document.getElementById("shareQrPageButton");
  let currentInvitation = null;
  let confirmLocked = false;

  function isFileMode() {
    return window.location.protocol === "file:";
  }

  function resolveToken() {
    const url = new URL(window.location.href);
    const queryToken = url.searchParams.get("token");

    if (queryToken) {
      return queryToken;
    }

    return pageConfig.defaultToken || rootConfig.defaultToken || "";
  }

  function appendToken(url, token) {
    if (!url) {
      return "";
    }

    if (!token || /[?&]token=/.test(url)) {
      return url;
    }

    return `${url}${url.indexOf("?") === -1 ? "?" : "&"}token=${encodeURIComponent(token)}`;
  }

  function buildLocalInvitationUrl(token) {
    return appendToken(pageConfig.invitationPagePath || "../../invitation.html", token);
  }

  function buildPublicInvitationUrl(token) {
    const publicPath = String(
      pageConfig.publicInvitationPath ||
        rootConfig.publicInvitationPath ||
        "/couple-lumu/invitation.html"
    ).trim();
    const normalizedPath = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
    const publicBaseUrl = String(
      pageConfig.publicBaseUrl || rootConfig.publicBaseUrl || "https://hope-events.vercel.app"
    )
      .trim()
      .replace(/\/+$/, "");

    return `${publicBaseUrl}${normalizedPath}?token=${encodeURIComponent(token || "")}`;
  }

  function buildPublicQrPageUrl() {
    if (!isFileMode()) {
      return window.location.href;
    }

    const publicPath = String(pageConfig.publicPagePath || "").trim();
    const publicBaseUrl = String(
      pageConfig.publicBaseUrl || rootConfig.publicBaseUrl || "https://hope-events.vercel.app"
    )
      .trim()
      .replace(/\/+$/, "");

    if (!publicPath) {
      return buildPublicInvitationUrl(resolveToken());
    }

    const normalizedPath = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
    return appendToken(`${publicBaseUrl}${normalizedPath}`, resolveToken());
  }

  function setFeedback(message, isError) {
    if (!feedbackNode) {
      return;
    }

    feedbackNode.textContent = message || "";
    feedbackNode.style.color = isError ? "#ffb8b8" : "rgba(247, 239, 229, 0.74)";
  }

  function getPosterPath() {
    return pageConfig.posterPath || "./Invitation_Couple_Kuanzambi_Table_Amour.png";
  }

  function getPosterDownloadPath() {
    return pageConfig.posterDownloadPath || getPosterPath();
  }

  function applyPoster() {
    if (posterViewer) {
      posterViewer.src = getPosterPath();
    }

    if (openCardButton) {
      openCardButton.href = getPosterDownloadPath();
    }
  }

  function applyInvitation(invitation) {
    currentInvitation = invitation;
    document.title = `Carte invitée | ${invitation.guestName || "Invité"} | ${
      invitation.coupleNames || pageConfig.coupleNames || "Hope Events"
    }`;
  }

  async function copyText(value) {
    if (!value) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      window.alert(value);
      return false;
    }
  }

  async function handleShare() {
    const qrPageUrl = buildPublicQrPageUrl();

    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          text: "Carte d'invitation privée Hope Events",
          url: qrPageUrl
        });
        return;
      }

      const copied = await copyText(qrPageUrl);

      if (copied) {
        setFeedback("Lien copié.", false);
      }
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }

      setFeedback("Partage indisponible pour le moment.", true);
    }
  }

  function initStaticActions() {
    if (invitationButton) {
      invitationButton.href = buildLocalInvitationUrl(resolveToken());
    }

    if (shareButton) {
      shareButton.addEventListener("click", handleShare);
    }
  }

  function initConfirmButton() {
    if (!confirmButton) {
      return;
    }

    confirmButton.addEventListener("click", async function () {
      if (confirmLocked || !window.HopeEventsApi || typeof window.HopeEventsApi.saveRsvp !== "function") {
        return;
      }

      const token = resolveToken();
      const guestName =
        (currentInvitation && currentInvitation.guestName) || pageConfig.guestName || "Invité";

      confirmLocked = true;
      confirmButton.disabled = true;
      setFeedback("Confirmation en cours...", false);

      try {
        await window.HopeEventsApi.saveRsvp({
          token,
          guestName,
          phone: "",
          attendance: "oui",
          companions: 0,
          note: "Confirmation rapide depuis la carte QR invitée"
        });

        confirmButton.classList.add("is-primary");
        confirmButton.innerHTML =
          '<span class="guest-action-icon">❤</span><span class="guest-action-label">Présence confirmée</span>';
        setFeedback("Présence confirmée.", false);
      } catch (error) {
        confirmLocked = false;
        confirmButton.disabled = false;
        setFeedback(error.message || "Confirmation impossible pour le moment.", true);
      }
    });
  }

  async function hydrate() {
    if (!window.HopeEventsApi || typeof window.HopeEventsApi.getInvitation !== "function") {
      return;
    }

    try {
      const payload = await window.HopeEventsApi.getInvitation(resolveToken());

      if (payload && payload.data) {
        applyInvitation(payload.data);
      }
    } catch (error) {
      setFeedback("", false);
    }
  }

  applyPoster();
  initStaticActions();
  initConfirmButton();
  hydrate();
})();
