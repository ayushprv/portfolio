const crypto = require("crypto");

const siteUrl = "https://www.ayushyadav.me";

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(503).send("CMS authentication is not configured yet.");
    return;
  }

  const state = crypto.randomBytes(24).toString("hex");
  res.setHeader("Set-Cookie", `cms_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", `${siteUrl}/api/callback`);
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("state", state);
  res.redirect(authorize.toString());
};
