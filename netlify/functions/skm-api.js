// netlify/functions/skm-api.js
// Generic same-origin proxy from Netlify -> Google Apps Script Web App.
// All business rules stay in Apps Script.

exports.handler = async function (event) {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    return response(500, {
      ok: false,
      error: {
        code: "NETLIFY_CONFIG_MISSING",
        message: "APPS_SCRIPT_URL belum dikonfigurasi di Netlify."
      }
    });
  }

  try {
    const method = (event.httpMethod || "GET").toUpperCase();

    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: commonHeaders(),
        body: ""
      };
    }

    if (!["GET", "POST"].includes(method)) {
      return response(405, {
        ok: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Metode tidak didukung."
        }
      });
    }

    let targetUrl = appsScriptUrl;

    const query = new URLSearchParams();
    const params = event.queryStringParameters || {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });

    if ([...query.keys()].length) {
      targetUrl += (targetUrl.includes("?") ? "&" : "?") + query.toString();
    }

    const fetchOptions = {
      method,
      redirect: "follow",
      headers: {
        "Accept": "application/json"
      }
    };

    if (method === "POST") {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = event.body || "{}";
    }

    const upstream = await fetch(targetUrl, fetchOptions);
    const text = await upstream.text();

    // Apps Script is expected to return JSON. If something else comes back
    // (for example an authorization/login page), surface a useful proxy error.
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (parseError) {
      return response(502, {
        ok: false,
        error: {
          code: "APPS_SCRIPT_NON_JSON",
          message: "Apps Script tidak mengembalikan JSON. Periksa deployment dan hak akses Web App.",
          upstreamStatus: upstream.status
        }
      });
    }

    return {
      statusCode: upstream.ok ? 200 : upstream.status,
      headers: commonHeaders(),
      body: JSON.stringify(payload)
    };

  } catch (error) {
    return response(502, {
      ok: false,
      error: {
        code: "NETLIFY_PROXY_ERROR",
        message: error && error.message
          ? error.message
          : "Tidak dapat terhubung ke Apps Script."
      }
    });
  }
};

function commonHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate"
  };
}

function response(statusCode, payload) {
  return {
    statusCode,
    headers: commonHeaders(),
    body: JSON.stringify(payload)
  };
}
