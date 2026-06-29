function setCommonHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
}

function sendJson(res, statusCode, payload) {
  setCommonHeaders(res);
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function allowMethods(req, res, methods) {
  res.setHeader("Allow", methods.join(", "));

  if (!methods.includes(req.method)) {
    sendJson(res, 405, {
      ok: false,
      error: `Method ${req.method} not allowed`
    });
    return false;
  }

  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

module.exports = {
  allowMethods,
  readBody,
  sendJson
};

