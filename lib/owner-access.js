const { admin, getFirestore } = require("./firebase-admin");

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function getAllowedPhones() {
  return String(process.env.OWNER_ALLOWED_PHONES || "")
    .split(",")
    .map(normalizePhone)
    .filter(Boolean);
}

async function verifyOwnerRequest(req) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return { ok: false, status: 401, error: "Connexion SMS requise" };
  }

  const allowedPhones = getAllowedPhones();

  if (!allowedPhones.length) {
    return { ok: false, status: 503, error: "Acces prive non configure" };
  }

  try {
    // Initialises the Admin SDK before validating the browser's Firebase token.
    if (!getFirestore()) {
      return { ok: false, status: 503, error: "Acces prive non configure" };
    }
    const decoded = await admin.auth().verifyIdToken(token);
    const phoneNumber = normalizePhone(decoded.phone_number);

    if (!phoneNumber || !allowedPhones.includes(phoneNumber)) {
      return { ok: false, status: 403, error: "Ce numero n'est pas autorise" };
    }

    return { ok: true, phoneNumber };
  } catch (error) {
    return { ok: false, status: 401, error: "Session SMS invalide ou expiree" };
  }
}

module.exports = { verifyOwnerRequest };
