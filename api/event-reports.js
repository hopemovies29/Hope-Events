const { allowMethods, sendJson } = require("../lib/http");
const { getEventReports } = require("../lib/invitation-service");

const OWNER_CODES = new Set(["12092026", "CS-PRIVE-2026", "HE-CSM-2026"]);
const CHRISTIAN_SEPHORA_EVENT_ID = "christian-sephora-palama-2026";

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) {
    return;
  }

  const key = String(req.query.key || "").trim().toUpperCase();
  const eventId = String(req.query.eventId || "").trim();

  if (!OWNER_CODES.has(key) || eventId !== CHRISTIAN_SEPHORA_EVENT_ID) {
    sendJson(res, 403, { ok: false, error: "Acces refuse" });
    return;
  }

  try {
    const record = await getEventReports(eventId);
    sendJson(res, 200, { ok: true, mode: record.mode, data: record.data });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || "Unexpected server error" });
  }
};
