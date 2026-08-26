const { allowMethods, readBody, sendJson } = require("../lib/http");

const CLIENT_SPACES = {
  "07082026": "/couple-lumu/espace-client-ben-julie",
  "HE-BLJ-2026": "/couple-lumu/espace-client-ben-julie",
  "12092026": "/couple-christian-sephora/espace-client-christian-sephora",
  "CS-PRIVE-2026": "/couple-christian-sephora/espace-client-christian-sephora"
};

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const body = await readBody(req);
    const code = String(body.code || "").trim().toUpperCase();
    const path = CLIENT_SPACES[code];

    if (!path) {
      sendJson(res, 404, { ok: false, error: "Espace client introuvable" });
      return;
    }

    sendJson(res, 200, { ok: true, path });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: "Code invalide" });
  }
};
