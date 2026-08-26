(function () {
  const rootConfig = window.HopeEventsPageConfig || {};
  const pageConfig = window.HopeEventsGuestInvitationConfig || {};
  const state = { invitation: null, attendance: "", drinks: [] };

  function token() {
    return new URL(window.location.href).searchParams.get("token") || pageConfig.defaultToken || rootConfig.defaultToken || "";
  }

  function feedback(id, message, error) {
    const node = document.getElementById(id);
    if (node) { node.textContent = message || ""; node.classList.toggle("is-error", Boolean(error)); }
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node && value) node.textContent = value;
  }

  function invitationUrl() {
    const path = String(pageConfig.publicPagePath || "").trim();
    const base = String(rootConfig.publicBaseUrl || "https://hope-events.vercel.app").replace(/\/+$/, "");
    return `${base}${path.startsWith("/") ? path : `/${path}`}?token=${encodeURIComponent(token())}`;
  }

  function reveal() {
    document.querySelectorAll("[data-reveal]").forEach(function (node, index) {
      window.setTimeout(function () { node.classList.add("is-visible"); }, 120 + index * 110);
    });
  }

  function splash() {
    const node = document.getElementById("invitationSplash");
    window.setTimeout(function () { if (node) node.classList.add("is-hidden"); }, 1500);
  }

  function renderDrinks(invitation) {
    const container = document.getElementById("drinkChoices");
    if (!container) return;
    const preferences = pageConfig.drinkPreferences || invitation.preferences || {};
    const categories = [
      { label: "Bières & alcoolisées", items: preferences.beers || preferences.alcoholic || [] },
      { label: "Vins & champagne", items: preferences.wine || [] },
      { label: "Sans alcool", items: preferences.soft || [] }
    ].filter(function (category) { return category.items.length; });
    container.innerHTML = categories.map(function (category) {
      return `<div class="drink-category"><p>${category.label}</p><div class="drink-options">${category.items.map(function (drink) {
        return `<button type="button" class="drink-choice" data-drink="${drink}">${drink}</button>`;
      }).join("")}</div></div>`;
    }).join("");
    container.addEventListener("click", function (event) {
      const choice = event.target.closest("[data-drink]");
      if (!choice) return;
      const drink = choice.dataset.drink;
      const index = state.drinks.indexOf(drink);
      if (index >= 0) state.drinks.splice(index, 1);
      else if (state.drinks.length < 2) state.drinks.push(drink);
      else { feedback("preferencesFeedback", "Choisissez au maximum deux boissons.", true); return; }
      container.querySelectorAll("[data-drink]").forEach(function (button) {
        button.classList.toggle("is-selected", state.drinks.includes(button.dataset.drink));
      });
      feedback("preferencesFeedback", "", false);
    });
  }

  function hydrate(invitation) {
    state.invitation = invitation;
    document.title = `Invitation | ${invitation.guestName || "Invité"} | Christian et Sephora`;
    setText("coupleNames", pageConfig.displayCoupleNames || invitation.coupleNames);
    setText("dateLabel", `${invitation.dateLabel || "Samedi 12 septembre 2026"} · 19h00`);
    setText("venueLabel", invitation.venueName);
    setText("addressLabel", invitation.venueAddress);
    setText("inviteeChip", invitation.guestName);
    setText("tableChip", invitation.tableName);
    const author = document.getElementById("guestbookAuthor");
    if (author) author.value = invitation.guestName || "";
    const map = document.getElementById("mapButton");
    if (map && invitation.mapUrl) map.href = invitation.mapUrl;
    renderDrinks(invitation);
  }

  function initRsvp() {
    document.getElementById("rsvpOptions").addEventListener("click", function (event) {
      const choice = event.target.closest("[data-attendance]");
      if (!choice) return;
      state.attendance = choice.dataset.attendance;
      document.querySelectorAll("[data-attendance]").forEach(function (button) { button.classList.toggle("is-selected", button === choice); });
    });
    document.getElementById("saveRsvpButton").addEventListener("click", async function () {
      if (!state.attendance) { feedback("rsvpFeedback", "Choisissez votre réponse.", true); return; }
      const button = this; button.disabled = true;
      try {
        await window.HopeEventsApi.saveRsvp({ token: token(), guestName: state.invitation.guestName, eventId: pageConfig.eventId || state.invitation.eventId, coupleNames: pageConfig.displayCoupleNames, tableName: state.invitation.tableName, attendance: state.attendance, companions: Number(document.getElementById("companionsSelect").value), sourcePath: location.pathname, phone: "" });
        feedback("rsvpFeedback", "Merci, votre réponse est enregistrée.", false);
      } catch (error) { feedback("rsvpFeedback", error.message || "Enregistrement impossible.", true); }
      finally { button.disabled = false; }
    });
  }

  function initPreferences() {
    document.getElementById("savePreferencesButton").addEventListener("click", async function () {
      if (!state.drinks.length) { feedback("preferencesFeedback", "Choisissez une ou deux boissons.", true); return; }
      const button = this; button.disabled = true;
      try {
        await window.HopeEventsApi.savePreferences({ token: token(), guestName: state.invitation.guestName, eventId: pageConfig.eventId || state.invitation.eventId, coupleNames: pageConfig.displayCoupleNames, tableName: state.invitation.tableName, choices: state.drinks, sourcePath: location.pathname });
        feedback("preferencesFeedback", "Vos préférences sont enregistrées.", false);
      } catch (error) { feedback("preferencesFeedback", error.message || "Enregistrement impossible.", true); }
      finally { button.disabled = false; }
    });
  }

  function initGuestbook() {
    document.getElementById("sendGuestbookButton").addEventListener("click", async function () {
      const author = document.getElementById("guestbookAuthor").value.trim();
      const message = document.getElementById("guestbookMessage").value.trim();
      if (!author || !message) { feedback("guestbookFeedback", "Écrivez votre nom et votre message.", true); return; }
      const button = this; button.disabled = true;
      try {
        await window.HopeEventsApi.saveGuestbookMessage({ token: token(), guestName: state.invitation.guestName, eventId: pageConfig.eventId || state.invitation.eventId, coupleNames: pageConfig.displayCoupleNames, tableName: state.invitation.tableName, author, message, sourcePath: location.pathname });
        document.getElementById("guestbookMessage").value = "";
        feedback("guestbookFeedback", "Votre message est envoyé aux mariés.", false);
      } catch (error) { feedback("guestbookFeedback", error.message || "Envoi impossible.", true); }
      finally { button.disabled = false; }
    });
  }

  document.getElementById("shareButton").addEventListener("click", async function () {
    const url = invitationUrl();
    try { if (navigator.share) await navigator.share({ title: document.title, url }); else await navigator.clipboard.writeText(url); }
    catch (error) { window.prompt("Copiez ce lien", url); }
  });

  splash(); reveal(); initRsvp(); initPreferences(); initGuestbook();
  window.HopeEventsApi.getInvitation(token()).then(function (payload) {
    if (payload && payload.data) {
      hydrate(payload.data);
      if (typeof window.HopeEventsApi.recordView === "function") {
        window.HopeEventsApi.recordView(token()).catch(function () { return null; });
      }
    }
  }).catch(function () { feedback("rsvpFeedback", "Invitation indisponible pour le moment.", true); });
})();
