const QRCode = require("qrcode");
const { allowMethods } = require("../lib/http");
const { getInvitationByToken } = require("../lib/invitation-service");

function escapeXml(value) {
  return String(value || "").replace(/[&<>'"]/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" }[character];
  });
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;

  const token = String(req.query.token || "").trim();
  if (!token) {
    res.statusCode = 400;
    res.end("Token manquant");
    return;
  }

  try {
    const record = await getInvitationByToken(token);
    if (!record || !record.data) {
      res.statusCode = 404;
      res.end("Invitation introuvable");
      return;
    }

    const invitation = record.data;
    const invitationUrl = `https://hope-events.vercel.app/couple-christian-sephora/invitation?token=${encodeURIComponent(token)}`;
    const qrSvg = await QRCode.toString(invitationUrl, {
      type: "svg",
      width: 500,
      margin: 1,
      color: { dark: "#120d0a", light: "#fffdf8" }
    });
    const qrGraphic = qrSvg
      // Keep the QR viewport intact. Replacing it with a group loses the
      // original viewBox scale and renders only a tiny fragment of the code.
      .replace(/^<svg/, '<svg x="290" y="520"')
      .replace(/<\/svg>\s*$/, "</svg>");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#110c09"/>
  <rect x="28" y="28" width="1024" height="1294" rx="30" fill="none" stroke="#c6953e" stroke-width="3"/>
  <path d="M30 205 C210 80 345 70 535 30" fill="none" stroke="#d8ad55" stroke-width="9"/>
  <path d="M1050 1135 C840 1255 690 1270 535 1320" fill="none" stroke="#d8ad55" stroke-width="9"/>
  <text x="540" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="7" fill="#d8ad55">HOPE EVENTS</text>
  <text x="540" y="205" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#f8f0e4">MARIAGE DE CHRISTIAN &amp; SEPHORA</text>
  <text x="540" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="21" letter-spacing="5" fill="#d8ad55">CARTE QR PRIVEE</text>
  <text x="540" y="365" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="700" fill="#f8f0e4">${escapeXml(invitation.guestName)}</text>
  <text x="540" y="415" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" fill="#dac9b6">${escapeXml(invitation.tableName)}</text>
  <rect x="260" y="490" width="560" height="560" rx="28" fill="#fffdf8" stroke="#d8ad55" stroke-width="8"/>
  ${qrGraphic}
  <text x="540" y="1115" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#d8ad55">SCANNEZ MOI</text>
  <text x="540" y="1170" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#f8f0e4">POUR ACCEDER A L&apos;INVITATION</text>
  <text x="540" y="1210" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#f8f0e4">ET CONFIRMER VOTRE PRESENCE</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("Content-Disposition", `inline; filename="Carte-QR-${token}.svg"`);
    res.statusCode = 200;
    res.end(svg);
  } catch (error) {
    res.statusCode = 500;
    res.end("Generation de la carte impossible");
  }
};
