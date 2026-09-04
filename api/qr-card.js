const QRCode = require("qrcode");
const path = require("path");
const sharp = require("sharp");
const { allowMethods } = require("../lib/http");
const { getInvitationByToken } = require("../lib/invitation-service");

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

    const invitationUrl = `https://hope-events.vercel.app/couple-christian-sephora/invitation?token=${encodeURIComponent(token)}`;
    const qrBuffer = await QRCode.toBuffer(invitationUrl, {
      type: "png",
      width: 184,
      margin: 1,
      color: { dark: "#120d0a", light: "#fffdf8" }
    });
    const template = path.join(
      process.cwd(),
      "public",
      "couple-christian-sephora",
      "Table Clou de girofle",
      "couple-palama",
      "carte-qr.webp"
    );
    // The existing card remains the visual template; only its QR area changes.
    const card = await sharp(template)
      .composite([{ input: qrBuffer, left: 38, top: 1086 }])
      .webp({ quality: 94 })
      .toBuffer();

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("Content-Disposition", `inline; filename="Carte-QR-${token}.webp"`);
    res.statusCode = 200;
    res.end(card);
  } catch (error) {
    res.statusCode = 500;
    res.end("Generation de la carte impossible");
  }
};
