const { allowMethods, readBody, sendJson } = require("../lib/http");
const { recordView } = require("../lib/invitation-service");

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const body = await readBody(req);
    const token = String(body.token || "").trim();

    if (!token) {
      sendJson(res, 400, {
        ok: false,
        error: "Missing token"
      });
      return;
    }

    const result = await recordView(token);

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

