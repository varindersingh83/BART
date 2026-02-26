const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 5173);
const BART_API_KEY = process.env.BART_API_KEY || "MW9S-E7SL-26DU-VV8V";
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function redactApiKey(url) {
  return url.replace(/key=[^&]+/i, "key=REDACTED");
}

function logProxyError(tag, status, url, bodyText) {
  const snippet = bodyText ? bodyText.slice(0, 300) : "";
  console.log(
    `[BART proxy] ${tag} status=${status} url=${redactApiKey(
      url
    )} body=${JSON.stringify(snippet)}`
  );
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    return send(res, 204, "", {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
  }

  if (req.method !== "GET") {
    return send(res, 405, "Method Not Allowed");
  }

  const orig = url.searchParams.get("orig") || "EMBR";
  const bartBase = "api.bart.gov/api/etd.aspx";
  const bartQuery = `cmd=etd&orig=${encodeURIComponent(orig)}&key=${BART_API_KEY}&json=y`;
  const bartUrlHttps = `https://${bartBase}?${bartQuery}`;
  const bartUrlHttp = `http://${bartBase}?${bartQuery}`;
  console.log(
    `[BART proxy] request orig=${orig} https=${redactApiKey(bartUrlHttps)}`
  );

  try {
    const upstream = await fetch(bartUrlHttps, {
      method: "GET",
      headers: {
        "User-Agent": "BART-Local-Proxy/1.0",
        Accept: "application/json"
      }
    });

    const status = upstream.status;
    const bodyText = await upstream.text();

    if (status === 403 || status === 404) {
      logProxyError("https-fallback", status, bartUrlHttps, bodyText);
      const fallback = await fetch(bartUrlHttp, {
        method: "GET",
        headers: {
          "User-Agent": "BART-Local-Proxy/1.0",
          Accept: "application/json"
        }
      });
      const fallbackText = await fallback.text();
      if (!fallback.ok) {
        logProxyError("http-error", fallback.status, bartUrlHttp, fallbackText);
      } else {
        console.log(
          `[BART proxy] http ok status=${fallback.status} url=${redactApiKey(
            bartUrlHttp
          )}`
        );
      }
      return send(res, fallback.status, fallbackText, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": fallback.ok
          ? "application/json; charset=utf-8"
          : "text/plain; charset=utf-8"
      });
    }

    if (!upstream.ok) {
      logProxyError("https-error", status, bartUrlHttps, bodyText);
      return send(res, status, bodyText, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain; charset=utf-8"
      });
    }

    console.log(
      `[BART proxy] https ok status=${status} url=${redactApiKey(bartUrlHttps)}`
    );
    return send(res, 200, bodyText, {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8"
    });
  } catch (err) {
    console.log(`[BART proxy] upstream fetch failed: ${err && err.message}`);
    return send(res, 502, "Upstream request failed", {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain; charset=utf-8"
    });
  }
}

function resolveFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const safePath = path.normalize(cleanPath).replace(/^\.+/, "");
  const filePath = path.join(ROOT_DIR, safePath);
  return filePath;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  console.log(`[HTTP] ${req.method} ${url.pathname}${url.search}`);

  if (url.pathname.startsWith("/api/etd")) {
    return handleApi(req, res, url);
  }

  let filePath = resolveFilePath(url.pathname);
  if (url.pathname === "/") {
    filePath = path.join(ROOT_DIR, "index.html");
  }

  if (!filePath.startsWith(ROOT_DIR)) {
    return send(res, 403, "Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, "Not Found");
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || "application/octet-stream";
    return send(res, 200, data, { "Content-Type": type });
  });
});

server.listen(PORT, () => {
  console.log(`INFO  Accepting connections at http://localhost:${PORT}`);
});
