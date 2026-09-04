(function () {
  const eventId = "christian-sephora-palama-2026";
  const code = new URL(window.location.href).searchParams.get("key") || sessionStorage.getItem("hope-events-client-code") || "";
  const form = document.getElementById("invitationForm");
  const feedback = document.getElementById("adminFeedback");
  const result = document.getElementById("adminResult");
  const submitButton = document.getElementById("submitInvitation");
  const cancelEdit = document.getElementById("cancelEdit");
  const createdRows = document.getElementById("adminCreatedRows");
  let shareUrl = "";
  let editingToken = "";
  let adminInvitations = [];

  function showFeedback(message, error) { feedback.textContent = message; feedback.classList.toggle("is-error", Boolean(error)); }
  async function request(url, options) { const response = await fetch(url, options); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Operation impossible"); return payload; }
  function endpoint(method, body) { return request("/api/admin-invitations", { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ key: code, eventId: eventId }, body)) }); }

  function resetForm() { editingToken = ""; form.reset(); submitButton.textContent = "Créer l'invitation QR"; cancelEdit.classList.add("is-hidden"); }

  function renderCreatedInvitations() {
    createdRows.innerHTML = "";
    if (!adminInvitations.length) { const empty = document.createElement("p"); empty.className = "admin-feedback"; empty.textContent = "Les nouvelles invitations créées depuis cet admin apparaîtront ici."; createdRows.appendChild(empty); return; }
    adminInvitations.forEach(function (invitation) {
      const row = document.createElement("article"); row.className = "admin-created-row";
      const details = document.createElement("div"); const name = document.createElement("strong"); const table = document.createElement("span"); name.textContent = invitation.guestName; table.textContent = invitation.tableName; details.append(name, table);
      const actions = document.createElement("div"); actions.className = "admin-row-actions";
      const edit = document.createElement("button"); edit.type = "button"; edit.textContent = "Modifier";
      edit.addEventListener("click", function () { editingToken = invitation.token; form.guestName.value = invitation.guestName; form.tableName.value = invitation.tableName; submitButton.textContent = "Enregistrer les modifications"; cancelEdit.classList.remove("is-hidden"); form.scrollIntoView({ behavior: "smooth", block: "center" }); });
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "delete"; remove.textContent = "Supprimer";
      remove.addEventListener("click", async function () { if (!window.confirm(`Supprimer l'invitation de ${invitation.guestName} ?`)) return; try { await endpoint("DELETE", { token: invitation.token }); adminInvitations = adminInvitations.filter(function (item) { return item.token !== invitation.token; }); renderCreatedInvitations(); showFeedback("Invitation supprimée.", false); } catch (error) { showFeedback(error.message, true); } });
      actions.append(edit, remove); row.append(details, actions); createdRows.appendChild(row);
    });
  }

  async function loadSpace() {
    const payload = await request(`/api/event-space?key=${encodeURIComponent(code)}`, { method: "GET" });
    const invitations = payload.data.invitations || [];
    const tables = Array.from(new Set(invitations.map(function (item) { return item.tableName; }))).sort();
    document.getElementById("knownTables").innerHTML = tables.map(function (table) { const option = document.createElement("option"); option.value = table; return option.outerHTML; }).join("");
    adminInvitations = invitations.filter(function (item) { return item.isAdminCreated; }); renderCreatedInvitations();
  }

  if (!code) { showFeedback("Ouvrez cette page avec le code d'accès du mariage.", true); submitButton.disabled = true; return; }
  loadSpace().catch(function () { showFeedback("Impossible de charger les tables. Vérifiez le code d'accès.", true); });

  form.addEventListener("submit", async function (event) {
    event.preventDefault(); const updating = Boolean(editingToken); submitButton.disabled = true; showFeedback(updating ? "Mise à jour..." : "Création de la carte QR...", false);
    try {
      const payload = await endpoint(updating ? "PATCH" : "POST", { token: editingToken, guestName: form.guestName.value, tableName: form.tableName.value });
      const invitation = payload.data; shareUrl = `${location.origin}${invitation.qrUrl}`;
      document.getElementById("resultGuest").textContent = invitation.guestName; document.getElementById("resultTable").textContent = invitation.tableName; document.getElementById("resultQr").href = shareUrl; document.getElementById("resultInvitation").href = `${location.origin}${invitation.invitationUrl}`;
      result.classList.remove("is-hidden"); resetForm(); await loadSpace(); showFeedback(updating ? "Invitation modifiée." : "Invitation créée avec succès.", false);
    } catch (error) { showFeedback(error.message, true); }
    finally { submitButton.disabled = false; }
  });
  cancelEdit.addEventListener("click", resetForm);
  document.getElementById("copyShareLink").addEventListener("click", async function () { if (!shareUrl) return; await navigator.clipboard.writeText(shareUrl); this.textContent = "Lien copié"; });
})();
