const { allowMethods, readBody, sendJson } = require("../lib/http");
const { savePreferences } = require("../lib/invitation-service");

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
    const choices = Array.isArray(body.choices) ? body.choices : [];

    if (!token) {
      sendJson(res, 400, {
        ok: false,
        error: "Missing token"
      });
      return;
    }

    if (!choices.length || choices.length > 2) {
      sendJson(res, 400, {
        ok: false,
        error: "Please send one or two choices"
      });
      return;
    }

    const result = await savePreferences({
      token,
      guestName,
      eventId,
      coupleNames,
      tableName,
      sourcePath,
      choices
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
