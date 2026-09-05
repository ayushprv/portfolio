import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, "utf8"));
let changed = [...new Set([
  ...(event.head_commit?.added || []),
  ...(event.head_commit?.modified || [])
])];

// GitHub occasionally omits head_commit file lists. Read the checked-out commit
// directly so a real CMS publish can never silently become a no-op.
if (!changed.length) {
  try {
    changed = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], { encoding: "utf8" })
      .split(/\\r?\\n/)
      .filter(Boolean);
  } catch (error) {
    console.warn("Could not read the Git diff:", error.message);
  }
}
const siteUrl = process.env.SITE_URL || "https://www.ayushyadav.me";
const endpoint = process.env.APPS_SCRIPT_URL;
const secret = process.env.SUBSCRIBER_WEBHOOK_SECRET;
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const previousSha = event.before;

if (!endpoint || !secret) {
  throw new Error("Missing APPS_SCRIPT_URL or SUBSCRIBER_WEBHOOK_SECRET.");
}
if (!repository || !sha) {
  throw new Error("Missing GitHub repository context.");
}

const raw = (ref, path) => `https://raw.githubusercontent.com/${repository}/${ref}/${path}`;
const slugify = value => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "untitled";
const entryKey = entry => JSON.stringify(entry);

async function readJson(ref, path) {
  const response = await fetch(raw(ref, path));
  if (!response.ok) throw new Error(`Could not read ${path} at ${ref}.`);
  return response.json();
}

async function newlyAddedEntries(path) {
  const current = await readJson(sha, path);
  const currentEntries = Array.isArray(current.entries) ? current.entries : [];

  // A first-ever push has no usable parent. Treat its entries as new.
  if (!previousSha || /^0+$/.test(previousSha)) return currentEntries;

  const previousResponse = await fetch(raw(previousSha, path));
  if (previousResponse.status === 404) return currentEntries;
  if (!previousResponse.ok) throw new Error(`Could not compare the previous version of ${path}.`);

  const previous = await previousResponse.json();
  const oldKeys = new Set((Array.isArray(previous.entries) ? previous.entries : []).map(entryKey));
  return currentEntries.filter(entry => !oldKeys.has(entryKey(entry)));
}

console.log("Changed files:", JSON.stringify(changed));
const notices = [];

if (changed.includes("content/gallery.json")) {
  const entries = await newlyAddedEntries("content/gallery.json");
  for (const entry of entries) {
    const year = String(entry.date || new Date().getFullYear()).slice(0, 4);
    notices.push({
      kind: "gallery post",
      title: entry.title || "a new gallery post",
      url: `${siteUrl}/gallery/${year}/${slugify(entry.slug || entry.title)}.html`
    });
  }
}

if (changed.includes("content/writings.json")) {
  const entries = await newlyAddedEntries("content/writings.json");
  for (const entry of entries) {
    notices.push({
      kind: "writing",
      title: entry.title || "a new writing",
      url: `${siteUrl}/writings.html`
    });
  }
}

// Keep support for a manually added standalone gallery page.
if (!notices.length) {
  const post = changed.find(path => /^gallery\/\d{4}\/.+\.html$/.test(path));
  if (post && (event.head_commit?.added || []).includes(post)) {
    const page = await (await fetch(raw(sha, post))).text();
    const title = page.match(/<title>([^<]+)/i)?.[1]?.trim() || "a new gallery post";
    notices.push({ kind: "gallery post", title, url: `${siteUrl}/${post}` });
  }
}

if (!notices.length) {
  console.log("No newly published gallery or writing entry detected; no email was sent.");
  process.exit(0);
}

console.log("Sending notices:", JSON.stringify(notices.map(({ kind, title, url }) => ({ kind, title, url }))));
for (const notice of notices) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "publish", secret, ...notice })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || "Subscriber notification failed.");
  if (!Number.isInteger(result.sent) || result.sent < 1) {
    throw new Error(`No active subscribers were notified for ${notice.title}. Check the subscriber Sheet status values.`);
  }
  console.log(`Sent ${result.sent} notification(s) for ${notice.title}.`);
}
