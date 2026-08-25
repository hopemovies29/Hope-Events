(function () {
  const rootConfig = window.HopeEventsPageConfig || {};
  const pageConfig = window.HopeEventsGuestInvitationConfig || {};
  const state = {
    invitation: null,
    selectedAttendance: "",
    selectedChoices: [],
    countdownTimer: null,
    heartsTimer: null
  };
  const splashNode = document.getElementById("invitationSplash");

  const drinkIcons = {
    "Coca-Cola": "🥤",
    Coca: "🥤",
    Fanta: "🧡",
    Sprite: "🥛",
    Eau: "💧",
    "Vin rouge": "🍷",
    "Vin blanc": "🥂",
    Vin: "🍷",
    Jus: "🧃",
    Bière: "🍺",
    Primus: "🍺",
    Castel: "🍺",
    Champagne: "🥂",
    Mojito: "🍸",
    Maltina: "🥤",
    Tonic: "🥛",
    "Jus d'ananas": "🍍"
  };

  function resolveToken() {
    const url = new URL(window.location.href);
    return (
      url.searchParams.get("token") ||
      pageConfig.defaultToken ||
      rootConfig.defaultToken ||
      "table-mangue-aicha-nsonsa"
    );
  }

  function buildPublicInvitationUrl(token) {
    const publicPath = String(
      pageConfig.publicPagePath ||
        pageConfig.publicInvitationPath ||
        rootConfig.publicInvitationPath ||
        ""
    ).trim();
    const normalizedPath = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
    const publicBaseUrl = String(
      pageConfig.publicBaseUrl || rootConfig.publicBaseUrl || "https://hope-events.vercel.app"
    )
      .trim()
      .replace(/\/+$/, "");

    return `${publicBaseUrl}${normalizedPath}?token=${encodeURIComponent(token || "")}`;
  }

  function getDisplayCoupleNames(invitation) {
    return (
      pageConfig.displayCoupleNames ||
      invitation.displayCoupleNames ||
      invitation.coupleNames ||
      "Christian et Sephora"
    );
  }

  function setText(id, value) {
    const node = document.getElementById(id);

    if (node) {
      node.textContent = value || "";
    }
  }

  function setFeedback(id, message, isError) {
    const node = document.getElementById(id);

    if (!node) {
      return;
    }

    node.textContent = message || "";
    node.style.color = isError ? "#b33f2f" : "";
  }

  function initSplash() {
    document.body.classList.add("splash-active");

    window.setTimeout(function () {
      if (splashNode) {
        splashNode.classList.add("is-hidden");
      }

      document.body.classList.remove("splash-active");
    }, 2000);
  }

  function cleanVenueName(value) {
    return String(value || "").replace(/\s*,\s*$/, "").trim();
  }

  function buildMapEmbedSrc(invitation) {
    const query =
      pageConfig.mapEmbedQuery ||
      [invitation.venueName, invitation.venueAddress].filter(Boolean).join(" ");

    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  }

  function renderStory() {
    const storyTrack = document.getElementById("storyTrack");
    const storyCopy = document.getElementById("storyCopy");
    const milestones = Array.isArray(pageConfig.storyMilestones) ? pageConfig.storyMilestones : [];

    if (storyTrack) {
      storyTrack.innerHTML = milestones
        .map(function (item) {
          return `
            <article class="story-item">
              <div class="story-icon">${item.icon || "❤"}</div>
              <strong>${item.title || ""}</strong>
              <span>${item.year || ""}</span>
            </article>
          `;
        })
        .join("");
    }

    if (storyCopy) {
      storyCopy.textContent = pageConfig.storyText || "";
    }
  }

  function renderProgramme(invitation) {
    const programmeList = document.getElementById("programmeList");
    const items = Array.isArray(pageConfig.programme) && pageConfig.programme.length
      ? pageConfig.programme
      : Array.isArray(invitation.schedule)
        ? invitation.schedule
        : [];

    if (!programmeList) {
      return;
    }

    programmeList.innerHTML = items
      .map(function (item) {
        return `
          <li>
            <strong class="programme-time">${item.time || ""}</strong>
            <span class="programme-label">${item.label || item.note || ""}</span>
          </li>
        `;
      })
      .join("");
  }

  function renderGallery() {
    const galleryGrid = document.getElementById("galleryGrid");
    const items = Array.isArray(pageConfig.galleryImages) ? pageConfig.galleryImages : [];

    if (!galleryGrid) {
      return;
    }

    galleryGrid.innerHTML = items
      .map(function (item) {
        return `
          <figure class="gallery-item">
            <img src="${item.src}" alt="${item.alt || "Christian et Sephora"}" />
          </figure>
        `;
      })
      .join("");
  }

  function renderDrinks(invitation) {
    const drinkChoices = document.getElementById("drinkChoices");

    if (!drinkChoices) {
      return;
    }

    const preferences = invitation.preferences || {};
    const options = Array.from(
      new Set([]
        .concat(Array.isArray(preferences.soft) ? preferences.soft : [])
        .concat(Array.isArray(preferences.alcoholic) ? preferences.alcoholic : []))
    ).slice(0, 8);

    drinkChoices.innerHTML = options
      .map(function (choice) {
        return `
          <button class="drink-choice" type="button" data-choice="${choice}">
            <span>${drinkIcons[choice] || "🍹"}</span>
            <strong>${choice}</strong>
          </button>
        `;
      })
      .join("");

    drinkChoices.addEventListener("click", function (event) {
      const button = event.target.closest("[data-choice]");

      if (!button) {
        return;
      }

      const choice = button.getAttribute("data-choice");
      const index = state.selectedChoices.indexOf(choice);

      if (index >= 0) {
        state.selectedChoices.splice(index, 1);
      } else {
        if (state.selectedChoices.length >= 2) {
          state.selectedChoices.shift();
        }

        state.selectedChoices.push(choice);
      }

      drinkChoices.querySelectorAll("[data-choice]").forEach(function (node) {
        node.classList.toggle(
          "is-active",
          state.selectedChoices.includes(node.getAttribute("data-choice"))
        );
      });
    });
  }

  function startCountdown(dateIso) {
    const target = dateIso ? new Date(dateIso) : null;

    if (state.countdownTimer) {
      window.clearInterval(state.countdownTimer);
      state.countdownTimer = null;
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
      state.countdownTimer = window.setInterval(update, 1000);
    }
  }

  function initReveal() {
    const revealNodes = document.querySelectorAll("[data-reveal]");

    if (!revealNodes.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      revealNodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealNodes.forEach(function (node, index) {
      node.style.transitionDelay = `${Math.min(index * 70, 240)}ms`;
      observer.observe(node);
    });
  }

  function spawnHeart() {
    const heartsRoot = document.getElementById("floatingHearts");

    if (!heartsRoot || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = Math.random() > 0.35 ? "❤" : "♥";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${0.8 + Math.random() * 1.35}rem`;
    heart.style.animationDuration = `${8 + Math.random() * 7}s`;
    heart.style.setProperty("--drift-x", `${-40 + Math.random() * 80}px`);

    heartsRoot.appendChild(heart);

    window.setTimeout(function () {
      heart.remove();
    }, 16000);
  }

  function initFloatingHearts() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    for (let index = 0; index < 7; index += 1) {
      window.setTimeout(spawnHeart, index * 520);
    }

    state.heartsTimer = window.setInterval(spawnHeart, 1900);
  }

  function applyInvitation(invitation) {
    state.invitation = invitation;
    const displayCoupleNames = getDisplayCoupleNames(invitation);

    setText("coupleNames", displayCoupleNames);
    setText("dateLabel", invitation.dateLabel || "");
    setText("venueLabel", cleanVenueName(invitation.venueName || ""));
    setText("addressLabel", invitation.venueAddress || "");
    setText("lovePhrase", invitation.eventPhrase || "");
    setText("inviteeChip", invitation.guestName || "Cher invité");
    setText("tableChip", invitation.tableName || "");
    setText("infoDate", invitation.dateLabel || "");
    setText("timeLabelInfo", invitation.timeLabel || "");
    setText(
      "venueLabelInfo",
      [cleanVenueName(invitation.venueName), invitation.venueAddress].filter(Boolean).join(", ")
    );
    setText("dressCodeValue", pageConfig.dressCode || "Élégant");
    setText("contactValue", pageConfig.contactLabel || "+243 827274226");

    document.title = `Invitation | ${displayCoupleNames} | ${invitation.guestName || "Invité"}`;

    const guestbookAuthor = document.getElementById("guestbookAuthor");
    const contactButton = document.getElementById("footerContactButton");
    const mapButton = document.getElementById("mapButton");
    const mapFrame = document.getElementById("mapFrame");

    if (guestbookAuthor && !guestbookAuthor.value) {
      guestbookAuthor.value = invitation.guestName || "";
    }

    if (contactButton && pageConfig.contactLink) {
      contactButton.href = pageConfig.contactLink;
    }

    if (mapButton && invitation.mapUrl) {
      mapButton.href = invitation.mapUrl;
    }

    if (mapFrame) {
      mapFrame.src = buildMapEmbedSrc(invitation);
    }

    const companionsSelect = document.getElementById("companionsSelect");

    if (companionsSelect) {
      const maxSeats = Math.max(0, Number(invitation.seats || 0));
      companionsSelect.innerHTML = Array.from(
        { length: Math.max(maxSeats, 2) + 1 },
        function (_, index) {
          return `<option value="${index}">${index}</option>`;
        }
      ).join("");
    }

    renderStory();
    renderProgramme(invitation);
    renderGallery();
    renderDrinks(invitation);
    startCountdown(invitation.dateIso);
  }

  function initShareAndCopy() {
    const copyLinkButton = document.getElementById("copyLinkButton");
    const shareButton = document.getElementById("shareButton");
    const footerShareButton = document.getElementById("footerShareButton");

    async function shareInvitation() {
      const link = buildPublicInvitationUrl(resolveToken());

      try {
        if (navigator.share) {
          await navigator.share({
            title: document.title,
            text: "Christian et Sephora vous invitent à leur mariage.",
            url: link
          });
          return;
        }

        await navigator.clipboard.writeText(link);
        setFeedback("guestbookFeedback", "Lien copié. Vous pouvez maintenant le partager.", false);
      } catch (error) {
        window.alert(link);
      }
    }

    if (copyLinkButton) {
      copyLinkButton.addEventListener("click", async function () {
        const link = buildPublicInvitationUrl(resolveToken());

        try {
          await navigator.clipboard.writeText(link);
          setFeedback("guestbookFeedback", "Lien copié.", false);
        } catch (error) {
          window.alert(link);
        }
      });
    }

    if (shareButton) {
      shareButton.addEventListener("click", shareInvitation);
    }

    if (footerShareButton) {
      footerShareButton.addEventListener("click", shareInvitation);
    }
  }

  function initRsvp() {
    const rsvpOptions = document.getElementById("rsvpOptions");
    const saveRsvpButton = document.getElementById("saveRsvpButton");
    const companionsSelect = document.getElementById("companionsSelect");

    if (rsvpOptions) {
      rsvpOptions.addEventListener("click", function (event) {
        const button = event.target.closest("[data-attendance]");

        if (!button) {
          return;
        }

        state.selectedAttendance = button.getAttribute("data-attendance") || "";
        rsvpOptions.querySelectorAll("[data-attendance]").forEach(function (node) {
          node.classList.toggle(
            "is-active",
            node.getAttribute("data-attendance") === state.selectedAttendance
          );
        });
      });
    }

    if (!saveRsvpButton) {
      return;
    }

    saveRsvpButton.addEventListener("click", async function () {
      if (!state.invitation || !window.HopeEventsApi || typeof window.HopeEventsApi.saveRsvp !== "function") {
        return;
      }

      if (!state.selectedAttendance) {
        setFeedback("rsvpFeedback", "Choisissez d'abord votre réponse.", true);
        return;
      }

      saveRsvpButton.disabled = true;
      setFeedback("rsvpFeedback", "Enregistrement de votre réponse...", false);

      try {
        await window.HopeEventsApi.saveRsvp({
          token: state.invitation.token,
          guestName: state.invitation.guestName || "Invité",
          eventId: state.invitation.eventId || "",
          coupleNames: getDisplayCoupleNames(state.invitation),
          tableName: state.invitation.tableName || "",
          sourcePath: window.location.pathname || "",
          phone: "",
          attendance: state.selectedAttendance,
          companions: Number(companionsSelect ? companionsSelect.value : 0),
          note: "Réponse envoyée depuis l'invitation complète"
        });

        setFeedback("rsvpFeedback", "Votre présence a bien été enregistrée.", false);
      } catch (error) {
        setFeedback("rsvpFeedback", error.message || "Impossible d'enregistrer la réponse.", true);
      } finally {
        saveRsvpButton.disabled = false;
      }
    });
  }

  function initPreferences() {
    const savePreferencesButton = document.getElementById("savePreferencesButton");

    if (!savePreferencesButton) {
      return;
    }

    savePreferencesButton.addEventListener("click", async function () {
      if (!state.invitation || !window.HopeEventsApi || typeof window.HopeEventsApi.savePreferences !== "function") {
        return;
      }

      if (!state.selectedChoices.length || state.selectedChoices.length > 2) {
        setFeedback("preferencesFeedback", "Choisissez une ou deux boissons.", true);
        return;
      }

      savePreferencesButton.disabled = true;
      setFeedback("preferencesFeedback", "Enregistrement de votre choix...", false);

      try {
        await window.HopeEventsApi.savePreferences({
          token: state.invitation.token,
          guestName: state.invitation.guestName || "Invité",
          eventId: state.invitation.eventId || "",
          coupleNames: getDisplayCoupleNames(state.invitation),
          tableName: state.invitation.tableName || "",
          sourcePath: window.location.pathname || "",
          choices: state.selectedChoices.slice(0, 2)
        });

        setFeedback("preferencesFeedback", "Préférences enregistrées avec succès.", false);
      } catch (error) {
        setFeedback(
          "preferencesFeedback",
          error.message || "Impossible d'enregistrer vos préférences.",
          true
        );
      } finally {
        savePreferencesButton.disabled = false;
      }
    });
  }

  function initGuestbook() {
    const sendGuestbookButton = document.getElementById("sendGuestbookButton");
    const authorInput = document.getElementById("guestbookAuthor");
    const messageInput = document.getElementById("guestbookMessage");

    if (!sendGuestbookButton || !authorInput || !messageInput) {
      return;
    }

    sendGuestbookButton.addEventListener("click", async function () {
      if (!state.invitation || !window.HopeEventsApi || typeof window.HopeEventsApi.saveGuestbookMessage !== "function") {
        return;
      }

      const author = authorInput.value.trim();
      const message = messageInput.value.trim();

      if (!author || !message) {
        setFeedback("guestbookFeedback", "Renseignez votre nom et votre message.", true);
        return;
      }

      sendGuestbookButton.disabled = true;
      setFeedback("guestbookFeedback", "Envoi de votre message...", false);

      try {
        await window.HopeEventsApi.saveGuestbookMessage({
          token: state.invitation.token,
          guestName: state.invitation.guestName || "Invité",
          eventId: state.invitation.eventId || "",
          coupleNames: getDisplayCoupleNames(state.invitation),
          tableName: state.invitation.tableName || "",
          sourcePath: window.location.pathname || "",
          author: author,
          message: message
        });

        messageInput.value = "";
        setFeedback("guestbookFeedback", "Votre message a été envoyé aux mariés.", false);
      } catch (error) {
        setFeedback("guestbookFeedback", error.message || "Impossible d'envoyer le message.", true);
      } finally {
        sendGuestbookButton.disabled = false;
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
      setFeedback("guestbookFeedback", "Impossible de charger cette invitation pour le moment.", true);
    }
  }

  initSplash();
  initReveal();
  initFloatingHearts();
  initShareAndCopy();
  initRsvp();
  initPreferences();
  initGuestbook();
  hydrate();
})();
