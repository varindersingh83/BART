const http = require("http");

const PORT = Number(process.env.PORT || 8080);
const BART_API_KEY = process.env.BART_API_KEY || "";

if (!BART_API_KEY) {
  console.warn("WARN: BART_API_KEY is not set; requests may fail.");
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function redactApiKey(url) {
  return url.replace(/key=[^&]+/i, "key=REDACTED");
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
    return send(res, 405, "Method Not Allowed", {
      "Access-Control-Allow-Origin": "*"
    });
  }

  const orig = url.searchParams.get("orig") || "EMBR";
  const bartQuery = `cmd=etd&orig=${encodeURIComponent(orig)}&key=${BART_API_KEY}&json=y`;
  const bartUrlHttps = `https://api.bart.gov/api/etd.aspx?${bartQuery}`;
  const bartUrlHttp = `http://api.bart.gov/api/etd.aspx?${bartQuery}`;

  try {
    const upstream = await fetch(bartUrlHttps, {
      method: "GET",
      headers: {
        "User-Agent": "BART-Render-Proxy/1.0",
        Accept: "application/json"
      }
    });

    const status = upstream.status;
    const bodyText = await upstream.text();

    if (status === 403 || status === 404) {
      const fallback = await fetch(bartUrlHttp, {
        method: "GET",
        headers: {
          "User-Agent": "BART-Render-Proxy/1.0",
          Accept: "application/json"
        }
      });
      const fallbackText = await fallback.text();
      console.log(`BART fallback status=${fallback.status} url=${redactApiKey(bartUrlHttp)}`);
      return send(res, fallback.status, fallbackText, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": fallback.ok
          ? "application/json; charset=utf-8"
          : "text/plain; charset=utf-8"
      });
    }

    if (!upstream.ok) {
      console.log(`BART error status=${status} url=${redactApiKey(bartUrlHttps)}`);
      return send(res, status, bodyText, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain; charset=utf-8"
      });
    }

    console.log(`BART ok status=${status} url=${redactApiKey(bartUrlHttps)}`);
    return send(res, 200, bodyText, {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8"
    });
  } catch (err) {
    console.log(`BART upstream fetch failed: ${err && err.message}`);
    return send(res, 502, "Upstream request failed", {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain; charset=utf-8"
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (url.pathname === "/health") {
    return send(res, 200, "ok", { "Content-Type": "text/plain" });
  }

  if (url.pathname.startsWith("/api/etd")) {
    return handleApi(req, res, url);
  }

  return send(res, 404, "Not Found", {
    "Access-Control-Allow-Origin": "*"
  });
});

server.listen(PORT, () => {
  console.log(`BART proxy listening on port ${PORT}`);
});
