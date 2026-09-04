(function () {
  const token = new URL(window.location.href).searchParams.get("token") || "";
  const root = "/couple-christian-sephora";
  const imageUrl = `/api/qr-card?token=${encodeURIComponent(token)}`;
  const feedback = document.getElementById("guestQrFeedback");

  if (!token) { feedback.textContent = "Carte QR introuvable."; return; }

  const invitationUrl = `${root}/invitation?token=${encodeURIComponent(token)}`;
  document.getElementById("posterViewer").src = imageUrl;
  document.getElementById("openInvitationButton").href = invitationUrl;
  document.getElementById("confirmPresenceButton").href = `${invitationUrl}#rsvpOptions`;
  document.getElementById("downloadCardButton").href = imageUrl;
  document.getElementById("downloadCardButton").download = "Carte-QR-Christian-Sephora.svg";

  window.HopeEventsApi.getInvitation(token).then(function (response) {
    const invitation = response.data;
    document.title = `Carte QR | ${invitation.guestName} | Christian et Sephora`;
    document.getElementById("posterViewer").alt = `Carte QR du ${invitation.guestName}`;
    document.getElementById("qrHelper").textContent = `Carte de ${invitation.guestName} · ${invitation.tableName}`;
  }).catch(function () { feedback.textContent = "Cette invitation est indisponible pour le moment."; });

  document.getElementById("shareQrPageButton").addEventListener("click", async function () {
    try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else await navigator.clipboard.writeText(location.href); feedback.textContent = "Lien de la carte copié."; }
    catch (error) { window.prompt("Copiez ce lien", location.href); }
  });
})();
