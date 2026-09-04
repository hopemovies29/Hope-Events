const { allowMethods, readBody, sendJson } = require("../lib/http");
const {
  createChristianSephoraInvitation,
  updateChristianSephoraInvitation,
  deleteChristianSephoraInvitation
} = require("../lib/invitation-service");

const OWNER_CODES = new Set(["12092026", "CS-PRIVE-2026", "HE-CSM-2026"]);
const EVENT_ID = "christian-sephora-palama-2026";

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["POST", "PATCH", "DELETE"])) return;

  try {
    const body = await readBody(req);
    const key = String(body.key || "").trim().toUpperCase();
    const eventId = String(body.eventId || "").trim();

    if (!OWNER_CODES.has(key) || eventId !== EVENT_ID) {
      sendJson(res, 403, { ok: false, error: "Acces refuse" });
      return;
    }

    if (req.method === "POST") {
      const invitation = await createChristianSephoraInvitation({
        guestName: body.guestName,
        tableName: body.tableName
      });
      sendJson(res, 201, { ok: true, data: invitation });
      return;
    }

    if (req.method === "PATCH") {
      const invitation = await updateChristianSephoraInvitation({
        token: body.token,
        guestName: body.guestName,
        tableName: body.tableName
      });
      sendJson(res, 200, { ok: true, data: invitation });
      return;
    }

    const invitation = await deleteChristianSephoraInvitation(body.token);
    sendJson(res, 200, { ok: true, data: invitation });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message || "Creation impossible" });
  }
};
