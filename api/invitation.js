const { allowMethods, sendJson } = require("../lib/http");
const { getInvitationByToken } = require("../lib/invitation-service");

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) {
    return;
  }

  const token = String(req.query.token || "").trim();

  if (!token) {
    sendJson(res, 400, {
      ok: false,
      error: "Missing token"
    });
    return;
  }

  try {
    const record = await getInvitationByToken(token);

    if (!record) {
      sendJson(res, 404, {
        ok: false,
        error: "Invitation not found"
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      mode: record.mode,
      data: record.data
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message || "Unexpected server error"
    });
  }
};

