(function () {
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const invitationContent = document.getElementById("invitation-content");
  const errorMessage = document.getElementById("error-message");
  const downloadButton = document.getElementById("download-button");
  const guestbookForm = document.getElementById("guestbook-form");
  const preferencesForm = document.getElementById("preferences-form");
  const guestbookFeedback = document.getElementById("guestbook-feedback");
  const preferencesFeedback = document.getElementById("preferences-feedback");

  function resolveToken() {
    const url = new URL(window.location.href);
    const queryToken = url.searchParams.get("token");

    if (queryToken) {
      return queryToken;
    }

    const parts = window.location.pathname.split("/").filter(Boolean);

    if (parts.length >= 2 && parts[0] === "invitation") {
      return decodeURIComponent(parts[1]);
    }

    if (window.HopeEventsDemo && window.HopeEventsDemo.defaultToken) {
      return window.HopeEventsDemo.defaultToken;
    }

    return "";
  }

  function showError(message) {
    loadingState.classList.add("is-hidden");
    invitationContent.classList.add("is-hidden");
    errorState.classList.remove("is-hidden");
    errorMessage.textContent = message;
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value || "";
    }
  }

  function resolveAssetPath(path) {
    if (!path) {
      return "";
    }

    if (window.location.protocol === "file:" && path.startsWith("/")) {
      return "." + path;
    }

    return path;
  }

  function applyPalette(palette) {
    if (!palette) {
      return;
    }

    const root = document.documentElement;

    if (palette.base) {
      root.style.setProperty("--page-bg", palette.base);
    }

    if (palette.accent) {
      root.style.setProperty("--accent", palette.accent);
    }

    if (palette.accentSoft) {
      root.style.setProperty("--accent-soft", palette.accentSoft);
    }

    if (palette.ink) {
      root.style.setProperty("--text", palette.ink);
    }

    if (palette.highlight) {
      root.style.setProperty("--highlight", palette.highlight);
    }
  }

  function renderSchedule(schedule) {
    const container = document.getElementById("schedule-grid");

    if (!container) {
      return;
    }

    container.innerHTML = (schedule || [])
      .map(function (item) {
        return `
          <article class="schedule-card">
            <span>${item.time}</span>
            <strong>${item.label}</strong>
            <p>${item.note || "Un temps fort pensé pour garder la journée fluide et mémorable."}</p>
          </article>
        `;
      })
      .join("");
  }

  function renderOptions(containerId, options, groupName) {
    const container = document.getElementById(containerId);

    if (!container) {
      return;
    }

    container.innerHTML = (options || [])
      .map(function (option, index) {
        const id = `${groupName}-${index}`;

        return `
          <label class="choice-chip" for="${id}">
            <input id="${id}" name="drink-choice" type="checkbox" value="${option}" />
            <span>${option}</span>
          </label>
        `;
      })
      .join("");
  }

  function selectedChoices() {
    return Array.from(document.querySelectorAll('input[name="drink-choice"]:checked')).map(
      function (input) {
        return input.value;
      }
    );
  }

  function initRevealAnimations() {
    const nodes = document.querySelectorAll(".reveal");

    if (!nodes.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
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
      {
        threshold: 0.18
      }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function handleGuestbookSubmit(token, guestName) {
    if (!guestbookForm) {
      return;
    }

    guestbookForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      guestbookFeedback.textContent = "";

      const author = document.getElementById("author-input").value.trim() || guestName;
      const message = document.getElementById("message-input").value.trim();

      if (message.length < 8) {
        guestbookFeedback.textContent = "Le message doit etre un peu plus detaille.";
        return;
      }

      try {
        await window.HopeEventsApi.saveGuestbookMessage({
          token: token,
          author: author,
          message: message
        });

        guestbookFeedback.textContent = "Votre mot a bien ete prepare pour les maries.";
      } catch (error) {
        guestbookFeedback.textContent = error.message || "Impossible d'envoyer le message.";
      }
    });
  }

  function handlePreferencesSubmit(token, guestName) {
    if (!preferencesForm) {
      return;
    }

    preferencesForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      preferencesFeedback.textContent = "";

      const choices = selectedChoices();

      if (!choices.length || choices.length > 2) {
        preferencesFeedback.textContent = "Choisis un ou deux gouts maximum.";
        return;
      }

      try {
        await window.HopeEventsApi.savePreferences({
          token: token,
          guestName: guestName,
          choices: choices
        });

        preferencesFeedback.textContent = "Vos preferences ont bien ete prises en compte.";
      } catch (error) {
        preferencesFeedback.textContent =
          error.message || "Impossible d'enregistrer les preferences.";
      }
    });

    preferencesForm.addEventListener("change", function () {
      const choices = selectedChoices();

      if (choices.length <= 2) {
        return;
      }

      const lastChecked = document.querySelectorAll('input[name="drink-choice"]:checked');
      const overflow = lastChecked[lastChecked.length - 1];

      if (overflow) {
        overflow.checked = false;
      }

      preferencesFeedback.textContent = "Deux choix maximum pour garder une planification simple.";
    });
  }

  function hydratePage(invitation) {
    applyPalette(invitation.palette);

    document.title = `Invitation | ${invitation.coupleNames} | ${invitation.guestName}`;

    setText("couple-names", invitation.coupleNames);
    setText("event-date-label", invitation.dateLabel);
    setText("guest-name", invitation.guestName);
    setText(
      "guest-seats",
      `${invitation.seats} place${invitation.seats > 1 ? "s reservees" : " reservee"}`
    );
    setText("event-intro", invitation.intro);
    setText("guest-message", invitation.personalMessage);
    setText("event-title", invitation.title);
    setText("guest-salutation", `${invitation.salutation},`);
    setText("event-story", invitation.story);
    setText("event-note", invitation.note);
    setText("letter-signature", invitation.coupleNames);
    setText("ceremony-label", invitation.ceremonyLabel || "Lieu de celebration");
    setText("venue-name", invitation.venueName);
    setText("venue-address", invitation.venueAddress);
    setText("footer-brand", invitation.footerBrand);

    const mapButton = document.getElementById("map-button");
    const whatsappLink = document.getElementById("whatsapp-link");
    const couplePhoto = document.getElementById("couple-photo");
    const authorInput = document.getElementById("author-input");

    if (mapButton) {
      mapButton.href = invitation.mapUrl || "#";
    }

    if (whatsappLink) {
      whatsappLink.href = invitation.whatsappLink || "#";
    }

    if (couplePhoto) {
      couplePhoto.src = resolveAssetPath(invitation.coverImage || "/assets/img/mariage.jpeg");
      couplePhoto.alt = invitation.coupleNames;
    }

    if (authorInput) {
      authorInput.value = invitation.guestName;
    }

    renderSchedule(invitation.schedule);
    renderOptions("alcoholic-options", invitation.preferences.alcoholic, "alcoholic");
    renderOptions("soft-options", invitation.preferences.soft, "soft");
  }

  async function init() {
    const token = resolveToken();

    if (!token) {
      showError("Aucun token n'a ete detecte dans le lien.");
      return;
    }

    try {
      const payload = await window.HopeEventsApi.getInvitation(token);
      const invitation = payload.data;

      hydratePage(invitation);

      loadingState.classList.add("is-hidden");
      errorState.classList.add("is-hidden");
      invitationContent.classList.remove("is-hidden");

      handleGuestbookSubmit(invitation.token, invitation.guestName);
      handlePreferencesSubmit(invitation.token, invitation.guestName);
      initRevealAnimations();

      window.HopeEventsApi.recordView(invitation.token).catch(function () {
        return null;
      });
    } catch (error) {
      showError(error.message || "Impossible de charger l'invitation.");
    }
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", function () {
      window.print();
    });
  }

  init();
})();
