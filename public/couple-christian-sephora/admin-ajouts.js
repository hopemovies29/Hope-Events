(function () {
  const eventId = "christian-sephora-palama-2026";
  const code = new URL(window.location.href).searchParams.get("key") || sessionStorage.getItem("hope-events-client-code") || "";
  const form = document.getElementById("invitationForm");
  const feedback = document.getElementById("adminFeedback");
  const result = document.getElementById("adminResult");
  let shareUrl = "";

  function showFeedback(message, error) { feedback.textContent = message; feedback.classList.toggle("is-error", Boolean(error)); }
  async function request(url, options) { const response = await fetch(url, options); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Operation impossible"); return payload; }

  if (!code) { showFeedback("Ouvrez cette page depuis votre espace client avec le code d'accès.", true); form.querySelector("button").disabled = true; return; }

  request(`/api/event-space?key=${encodeURIComponent(code)}`, { method: "GET" }).then(function (payload) {
    const tables = Array.from(new Set((payload.data.invitations || []).map(function (item) { return item.tableName; }))).sort();
    document.getElementById("knownTables").innerHTML = tables.map(function (table) { return `<option value="${table}"></option>`; }).join("");
  }).catch(function () { showFeedback("Impossible de charger les tables. Vérifiez le code d'accès.", true); });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const button = form.querySelector("button"); button.disabled = true; showFeedback("Création de la carte QR...", false);
    try {
      const payload = await request("/api/admin-invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: code, eventId: eventId, guestName: form.guestName.value, tableName: form.tableName.value }) });
      const invitation = payload.data;
      shareUrl = `${location.origin}${invitation.qrUrl}`;
      document.getElementById("resultGuest").textContent = invitation.guestName;
      document.getElementById("resultTable").textContent = invitation.tableName;
      document.getElementById("resultQr").href = shareUrl;
      document.getElementById("resultInvitation").href = `${location.origin}${invitation.invitationUrl}`;
      result.classList.remove("is-hidden"); form.reset(); showFeedback("Invitation créée avec succès.", false);
    } catch (error) { showFeedback(error.message, true); }
    finally { button.disabled = false; }
  });
  document.getElementById("copyShareLink").addEventListener("click", async function () { if (!shareUrl) return; await navigator.clipboard.writeText(shareUrl); this.textContent = "Lien copié"; });
})();
