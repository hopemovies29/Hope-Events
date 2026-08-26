const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..", "public", "couple-christian-sephora");
const template = path.join(root, "assets", "carte-qr-christian-sephora.jpg");
const publicBaseUrl = "https://hope-events.vercel.app";

function findQrPages(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findQrPages(fullPath);
    return entry.isFile() && /^qr-code-.*\.html$/i.test(entry.name) ? [fullPath] : [];
  });
}

function capture(source, expression, label) {
  const result = source.match(expression);
  if (!result) throw new Error(`Missing ${label}`);
  return result[1];
}

async function createCard(pagePath) {
  const source = fs.readFileSync(pagePath, "utf8");
  const token = capture(source, /defaultToken:\s*"([^"]+)"/, "guest token");
  const invitationPath = capture(source, /publicInvitationPath:\s*"([^"]+)"/, "invitation path");
  const invitationUrl = `${publicBaseUrl}${invitationPath}?token=${encodeURIComponent(token)}`;
  const qr = await QRCode.toBuffer(invitationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 184,
    color: { dark: "#000000", light: "#ffffff" }
  });
  await sharp(template)
    .composite([{ input: qr, left: 38, top: 1085 }])
    .webp({ quality: 88 })
    .toFile(path.join(path.dirname(pagePath), "carte-qr.webp"));
}

async function main() {
  const pages = findQrPages(root);
  for (const pagePath of pages) await createCard(pagePath);
  console.log(`Generated ${pages.length} personalized QR cards.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
