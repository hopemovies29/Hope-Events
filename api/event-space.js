const { allowMethods, sendJson } = require("../lib/http");
const { getEventSpaceByKey } = require("../lib/invitation-service");
const { verifyOwnerRequest } = require("../lib/owner-access");

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) {
    return;
  }

  const key = String(req.query.key || "").trim();

  if (!key) {
    sendJson(res, 400, {
      ok: false,
      error: "Missing key"
    });
    return;
  }

  const owner = await verifyOwnerRequest(req);

  if (!owner.ok) {
    sendJson(res, owner.status, { ok: false, error: owner.error });
    return;
  }

  try {
    const record = await getEventSpaceByKey(key);

    if (!record) {
      sendJson(res, 404, {
        ok: false,
        error: "Event space not found"
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
