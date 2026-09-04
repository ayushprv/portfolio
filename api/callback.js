const crypto = require("crypto");

const siteUrl = "https://www.ayushyadav.me";

function cookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => {
    const index = part.indexOf("=");
    return index === -1 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

function fail(res, message) {
  res.status(400).setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><title>CMS sign-in failed</title><p>${message}</p>`);
}

module.exports = async (req, res) => {
  const { code, state, error } = req.query;
  const expected = cookies(req.headers.cookie).cms_oauth_state;
  if (error || !code || !state || !expected || state.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected))) {
    fail(res, "The sign-in request could not be verified. Please close this window and try again.");
    return;
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(503).send("CMS authentication is not configured yet.");
    return;
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: `${siteUrl}/api/callback` })
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) {
      fail(res, "GitHub did not return an access token. Please try again.");
      return;
    }

    const payload = { token: token.access_token, provider: "github" };
    const callbackScript = `<script>
      (() => {
        const opener = window.opener;
        if (!opener) {
          document.body.textContent = "This sign-in window was opened without the CMS. Close it and start again from the CMS.";
          return;
        }

        function receiveMessage(event) {
          opener.postMessage(
            "authorization:github:success:" + ${JSON.stringify(JSON.stringify(payload))},
            event.origin
          );
          window.removeEventListener("message", receiveMessage, false);
          window.setTimeout(() => window.close(), 100);
        }

        window.addEventListener("message", receiveMessage, false);
        opener.postMessage("authorizing:github", "*");
      })();
    </script>`;
    res.setHeader("Set-Cookie", "cms_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><title>Signed in</title>${callbackScript}<p>Signed in. You can close this window.</p>`);
  } catch (_) {
    fail(res, "Could not reach GitHub. Please try again.");
  }
};
