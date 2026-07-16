const { allowMethods, readBody, sendJson } = require("../lib/http");
const { saveRsvpSubmission } = require("../lib/invitation-service");

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const body = await readBody(req);
    const token = String(body.token || "").trim();
    const guestName = String(body.guestName || "").trim();
    const eventId = String(body.eventId || "").trim();
    const coupleNames = String(body.coupleNames || "").trim();
    const tableName = String(body.tableName || "").trim();
    const sourcePath = String(body.sourcePath || "").trim();
    const phone = String(body.phone || "").trim();
    const attendance = String(body.attendance || "").trim();
    const companions = Number(body.companions || 0);
    const note = String(body.note || "").trim();

    if (!token || !guestName || !attendance) {
      sendJson(res, 400, {
        ok: false,
        error: "Token, guestName and attendance are required"
      });
      return;
    }

    if (!["oui", "non", "peut-etre"].includes(attendance)) {
      sendJson(res, 400, {
        ok: false,
        error: "Attendance must be oui, non or peut-etre"
      });
      return;
    }

    if (!Number.isFinite(companions) || companions < 0 || companions > 10) {
      sendJson(res, 400, {
        ok: false,
        error: "Companions must be between 0 and 10"
      });
      return;
    }

    const result = await saveRsvpSubmission({
      token,
      guestName,
      eventId,
      coupleNames,
      tableName,
      sourcePath,
      phone,
      attendance,
      companions,
      note
    });

    sendJson(res, 200, {
      ok: true,
      mode: result.mode,
      persisted: result.persisted
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message || "Unexpected server error"
    });
  }
};
