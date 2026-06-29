const { allowMethods, readBody, sendJson } = require("../lib/http");
const { saveGuestbookMessage } = require("../lib/invitation-service");

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) {
    return;
  }

  try {
    const body = await readBody(req);
    const token = String(body.token || "").trim();
    const author = String(body.author || "").trim();
    const message = String(body.message || "").trim();

    if (!token || !author || !message) {
      sendJson(res, 400, {
        ok: false,
        error: "Token, author and message are required"
      });
      return;
    }

    if (message.length < 8) {
      sendJson(res, 400, {
        ok: false,
        error: "Message too short"
      });
      return;
    }

    const result = await saveGuestbookMessage({
      token,
      author,
      message
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

