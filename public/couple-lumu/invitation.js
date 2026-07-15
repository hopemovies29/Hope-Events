(function () {
  const pageConfig = window.HopeEventsPageConfig || {};
  let currentInvitation = null;
  let countdownTimer = null;
  let confirmLocked = false;

  function isFileMode() {
    return window.location.protocol === "file:";
  }

  function resolveToken() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (token) {
      return token;
    }

    return pageConfig.defaultToken || "amour-couple-kuanzambi";
  }

  function buildPublicInvitationUrl(token) {
    const encoded = encodeURIComponent(token);
    const configuredPath = String(pageConfig.publicInvitationPath || "/couple-lumu/invitation.html").trim();
    const normalizedPath = configuredPath.startsWith("/") ? configuredPath : `/${configuredPath}`;
    const configuredBaseUrl = String(pageConfig.publicBaseUrl || "").trim().replace(/\/+$/, "");

    if (!isFileMode()) {
      return `${window.location.origin}${normalizedPath}?token=${encoded}`;
    }

    if (configuredBaseUrl) {
      return `${configuredBaseUrl}${normalizedPath}?token=${encoded}`;
    }

    return `https://hope-events.vercel.app${normalizedPath}?token=${encoded}`;
  }

  function setText(id, value) {
    const node = document.getElementById(id);

    if (node) {
      node.textContent = value || "";
    }
  }

  function setFeedback(message, isError) {
    const node = document.getElementById("confirmFeedback");

    if (!node) {
      return;
    }

    node.textContent = message || "";
    node.style.color = isError ? "#ffb4b4" : "#d8ba92";
  }

  function startCountdown(dateIso) {
    const target = dateIso ? new Date(dateIso) : null;

    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }

    function update() {
      if (!target || Number.isNaN(target.getTime())) {
        setText("daysValue", "--");
        setText("hoursValue", "--");
        setText("minutesValue", "--");
        setText("secondsValue", "--");
        return;
      }

      const diffMs = Math.max(target.getTime() - Date.now(), 0);
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setText("daysValue", String(days).padStart(2, "0"));
      setText("hoursValue", String(hours).padStart(2, "0"));
      setText("minutesValue", String(minutes).padStart(2, "0"));
      setText("secondsValue", String(seconds).padStart(2, "0"));
    }

    update();

    if (target && !Number.isNaN(target.getTime())) {
      countdownTimer = window.setInterval(update, 1000);
    }
  }

  function applyInvitation(invitation) {
    currentInvitation = invitation;

    setText("coupleNames", invitation.coupleNames || "Ben Lumu et Julie");
    setText(
      "inviteeChip",
      `${invitation.guestName || "Cher invite"}${invitation.tableName ? ` • ${invitation.tableName}` : ""}`
    );
    setText("lovePhrase", invitation.eventPhrase || "");
    setText("dateLabel", invitation.dateLabel || "");
    setText("timeLabel", invitation.timeLabel || "");
    setText("venueLabel", invitation.venueName || "");
    setText("addressLabel", invitation.venueAddress || "");

    const mapButton = document.getElementById("mapButton");
    const contactButton = document.getElementById("contactButton");

    if (mapButton && invitation.mapUrl) {
      mapButton.href = invitation.mapUrl;
    }

    if (contactButton && invitation.whatsappLink) {
      contactButton.href = invitation.whatsappLink;
    }

    document.title = `Invitation | ${invitation.coupleNames} | ${invitation.guestName || "Invite"}`;
    startCountdown(invitation.dateIso);
  }

  function initCopyAndShare() {
    const copyLinkButton = document.getElementById("copyLinkButton");
    const shareButton = document.getElementById("shareButton");
    const galleryButton = document.getElementById("galleryButton");

    if (copyLinkButton) {
      copyLinkButton.addEventListener("click", async function () {
        const link = buildPublicInvitationUrl(resolveToken());

        try {
          await navigator.clipboard.writeText(link);
          setFeedback("Lien copie. Vous pouvez l'envoyer directement a l'invite.", false);
        } catch (error) {
          window.alert(link);
        }
      });
    }

    if (shareButton) {
      shareButton.addEventListener("click", async function () {
        const link = buildPublicInvitationUrl(resolveToken());

        try {
          if (navigator.share) {
            await navigator.share({
              title: "Invitation de mariage",
              text: "Ben Lumu et Julie vous invitent a leur mariage.",
              url: link
            });
            return;
          }

          await navigator.clipboard.writeText(link);
          setFeedback("Lien copie. Vous pouvez maintenant le partager.", false);
        } catch (error) {
          window.alert(link);
        }
      });
    }

    if (galleryButton) {
      galleryButton.addEventListener("click", function () {
        const gallery = document.getElementById("gallery");

        if (gallery) {
          gallery.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start"
          });
        }
      });
    }
  }

  function initConfirmButton() {
    const confirmButton = document.getElementById("confirmButton");

    if (!confirmButton) {
      return;
    }

    confirmButton.addEventListener("click", async function () {
      if (confirmLocked || !currentInvitation || !window.HopeEventsApi) {
        return;
      }

      confirmLocked = true;
      confirmButton.disabled = true;
      setFeedback("Confirmation en cours...", false);

      try {
        if (typeof window.HopeEventsApi.saveRsvp === "function") {
          await window.HopeEventsApi.saveRsvp({
            token: currentInvitation.token,
            guestName: currentInvitation.guestName || "Invite",
            phone: "",
            attendance: "oui",
            companions: 0,
            note: "Confirmation rapide depuis l'invitation web"
          });
        }

        confirmButton.innerHTML = "<span>❤</span><small>Presence confirmee</small>";
        setFeedback("Merci. Votre presence est maintenant confirmee.", false);
      } catch (error) {
        confirmLocked = false;
        confirmButton.disabled = false;
        setFeedback(error.message || "Impossible de confirmer pour le moment.", true);
      }
    });
  }

  async function hydrate() {
    const token = resolveToken();

    if (!window.HopeEventsApi || typeof window.HopeEventsApi.getInvitation !== "function") {
      return;
    }

    try {
      const payload = await window.HopeEventsApi.getInvitation(token);

      if (!payload || !payload.data) {
        return;
      }

      applyInvitation(payload.data);

      if (typeof window.HopeEventsApi.recordView === "function") {
        window.HopeEventsApi.recordView(token).catch(function () {
          return null;
        });
      }
    } catch (error) {
      setFeedback("Impossible de charger cette invitation pour le moment.", true);
    }
  }

  initCopyAndShare();
  initConfirmButton();
  hydrate();
})();
