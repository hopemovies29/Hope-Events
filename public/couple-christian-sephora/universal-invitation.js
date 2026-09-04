(function () {
  const state = { invitation: null, attendance: "", drinks: [] };
  const token = new URL(window.location.href).searchParams.get("token") || "";
  const base = "https://hope-events.vercel.app/couple-christian-sephora";

  function feedback(id, message, error) {
    const node = document.getElementById(id);
    if (node) { node.textContent = message || ""; node.classList.toggle("is-error", Boolean(error)); }
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value || "";
  }

  function reveal() {
    document.querySelectorAll("[data-reveal]").forEach(function (node, index) {
      window.setTimeout(function () { node.classList.add("is-visible"); }, 120 + index * 110);
    });
  }

  function renderDrinks(invitation) {
    const choices = document.getElementById("drinkChoices");
    const preferences = invitation.preferences || {};
    const groups = [["Bières & alcoolisées", preferences.beers || []], ["Vins & spiritueux", preferences.wine || []], ["Sans alcool", preferences.soft || []]].filter(function (group) { return group[1].length; });
    choices.innerHTML = groups.map(function (group) { return `<div class="drink-category"><p>${group[0]}</p><div class="drink-options">${group[1].map(function (drink) { return `<button type="button" class="drink-choice" data-drink="${drink}">${drink}</button>`; }).join("")}</div></div>`; }).join("");
    choices.addEventListener("click", function (event) {
      const button = event.target.closest("[data-drink]");
      if (!button) return;
      const drink = button.dataset.drink;
      const index = state.drinks.indexOf(drink);
      if (index >= 0) state.drinks.splice(index, 1); else if (state.drinks.length < 2) state.drinks.push(drink); else { feedback("preferencesFeedback", "Choisissez au maximum deux boissons.", true); return; }
      choices.querySelectorAll("[data-drink]").forEach(function (item) { item.classList.toggle("is-selected", state.drinks.includes(item.dataset.drink)); });
      feedback("preferencesFeedback", "", false);
    });
  }

  function hydrate(invitation) {
    state.invitation = invitation;
    document.title = `Invitation | ${invitation.guestName} | Christian et Sephora`;
    setText("coupleNames", invitation.coupleNames || "Christian et Sephora");
    setText("dateLabel", `${invitation.dateLabel} · 19h00`);
    setText("venueLabel", invitation.venueName);
    setText("addressLabel", invitation.venueAddress);
    setText("inviteeChip", invitation.guestName);
    setText("tableChip", invitation.tableName);
    document.getElementById("guestbookAuthor").value = invitation.guestName || "";
    document.getElementById("mapButton").href = invitation.mapUrl || "#";
    renderDrinks(invitation);
  }

  function payload(extra) {
    return Object.assign({ token: token, guestName: state.invitation.guestName, eventId: state.invitation.eventId, coupleNames: state.invitation.coupleNames, tableName: state.invitation.tableName, sourcePath: location.pathname }, extra);
  }

  document.getElementById("rsvpOptions").addEventListener("click", function (event) {
    const button = event.target.closest("[data-attendance]"); if (!button) return;
    state.attendance = button.dataset.attendance;
    document.querySelectorAll("[data-attendance]").forEach(function (item) { item.classList.toggle("is-selected", item === button); });
  });
  document.getElementById("saveRsvpButton").addEventListener("click", async function () {
    if (!state.attendance) { feedback("rsvpFeedback", "Choisissez votre réponse.", true); return; }
    try { await window.HopeEventsApi.saveRsvp(payload({ attendance: state.attendance, companions: Number(document.getElementById("companionsSelect").value), phone: "" })); feedback("rsvpFeedback", "Merci, votre réponse est enregistrée.", false); } catch (error) { feedback("rsvpFeedback", error.message, true); }
  });
  document.getElementById("savePreferencesButton").addEventListener("click", async function () {
    if (!state.drinks.length) { feedback("preferencesFeedback", "Choisissez une ou deux boissons.", true); return; }
    try { await window.HopeEventsApi.savePreferences(payload({ choices: state.drinks })); feedback("preferencesFeedback", "Vos préférences sont enregistrées.", false); } catch (error) { feedback("preferencesFeedback", error.message, true); }
  });
  document.getElementById("sendGuestbookButton").addEventListener("click", async function () {
    const author = document.getElementById("guestbookAuthor").value.trim(); const message = document.getElementById("guestbookMessage").value.trim();
    if (!author || !message) { feedback("guestbookFeedback", "Écrivez votre nom et votre message.", true); return; }
    try { await window.HopeEventsApi.saveGuestbookMessage(payload({ author: author, message: message })); document.getElementById("guestbookMessage").value = ""; feedback("guestbookFeedback", "Votre message est envoyé aux mariés.", false); } catch (error) { feedback("guestbookFeedback", error.message, true); }
  });
  document.getElementById("shareButton").addEventListener("click", async function () { const url = `${base}/invitation?token=${encodeURIComponent(token)}`; try { if (navigator.share) await navigator.share({ title: document.title, url: url }); else await navigator.clipboard.writeText(url); } catch (error) { window.prompt("Copiez ce lien", url); } });

  if (!token) { feedback("rsvpFeedback", "Invitation introuvable.", true); return; }
  window.setTimeout(function () { document.getElementById("invitationSplash").classList.add("is-hidden"); }, 1500);
  reveal();
  window.HopeEventsApi.getInvitation(token).then(function (response) { hydrate(response.data); return window.HopeEventsApi.recordView(token); }).catch(function () { feedback("rsvpFeedback", "Invitation indisponible pour le moment.", true); });
})();
