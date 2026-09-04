import { readFile } from "node:fs/promises";

const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, "utf8"));
const changed = [...new Set([
  ...(event.head_commit?.added || []),
  ...(event.head_commit?.modified || [])
])];
const siteUrl = process.env.SITE_URL || "https://www.ayushyadav.me";
const endpoint = process.env.APPS_SCRIPT_URL;
const secret = process.env.SUBSCRIBER_WEBHOOK_SECRET;

if (!endpoint || !secret) {
  throw new Error("Missing APPS_SCRIPT_URL or SUBSCRIBER_WEBHOOK_SECRET.");
}

const raw = path => `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/${process.env.GITHUB_SHA}/${path}`;
const slugify = value => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "untitled";

async function readJson(path) {
  const response = await fetch(raw(path));
  if (!response.ok) throw new Error(`Could not read ${path}.`);
  return response.json();
}

const notices = [];
if (changed.includes("content/gallery.json")) {
  const { entries = [] } = await readJson("content/gallery.json");
  const entry = [...entries].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
  if (entry) {
    const year = String(entry.date || new Date().getFullYear()).slice(0, 4);
    notices.push({ kind: "gallery post", title: entry.title || "a new gallery post", url: `${siteUrl}/gallery/${year}/${slugify(entry.slug || entry.title)}.html` });
  }
}
if (changed.includes("content/writings.json")) {
  const { entries = [] } = await readJson("content/writings.json");
  const entry = [...entries].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
  if (entry) notices.push({ kind: "writing", title: entry.title || "a new writing", url: `${siteUrl}/writings.html` });
}
if (!notices.length) {
  const post = changed.find(path => /^gallery\/\d{4}\/.+\.html$/.test(path));
  if (post) {
    const page = await (await fetch(raw(post))).text();
    const title = page.match(/<title>([^<]+)/i)?.[1]?.trim() || "a new gallery post";
    notices.push({ kind: "gallery post", title, url: `${siteUrl}/${post}` });
  }
}

for (const notice of notices) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "publish", secret, ...notice })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || "Subscriber notification failed.");
  console.log(`Sent ${result.sent || 0} notification(s) for ${notice.title}.`);
}
