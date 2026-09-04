module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const email = String(req.body && req.body.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const endpoint = process.env.APPS_SCRIPT_URL;
  if (!endpoint) {
    res.status(503).json({ error: "Subscriptions are being set up. Please try again soon." });
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "subscribe", email, source: "homepage" }),
      redirect: "follow"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Subscription request failed.");
    }
    res.status(200).json({ ok: true, alreadySubscribed: Boolean(payload.alreadySubscribed) });
  } catch (_) {
    res.status(502).json({ error: "Could not subscribe you right now. Please try again." });
  }
};