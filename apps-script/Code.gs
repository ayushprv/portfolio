const CONFIG = PropertiesService.getScriptProperties();

function doPost(event) {
  try {
    const data = JSON.parse(event && event.postData && event.postData.contents || "{}");
    if (data.action === "subscribe") return json_(subscribe_(data));
    if (data.action === "publish") return json_(publish_(data));
    return json_({ ok: false, error: "Unknown action." });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: "Something went wrong." });
  }
}

function subscribe_(data) {
  const email = String(data.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = subscriberSheet_();
    const rows = sheet.getDataRange().getValues();
    const existing = rows.slice(1).findIndex(row => String(row[0]).toLowerCase() === email);
    if (existing !== -1) {
      const row = existing + 2;
      sheet.getRange(row, 3).setValue("active");
      return { ok: true, alreadySubscribed: true };
    }

    sheet.appendRow([email, new Date(), "active", String(data.source || "website"), ""]);
    MailApp.sendEmail({
      to: email,
      name: "Ayush Notes",
      subject: "you're on the list — ayush notes",
      body: "You're in. I'll send you a note whenever something new goes up.\n\nhttps://www.ayushyadav.me/",
      htmlBody: '<p>You’re in.</p><p>I’ll send you a note whenever something new goes up.</p><p><a href="https://www.ayushyadav.me/">visit ayush notes →</a></p>'
    });
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function publish_(data) {
  if (String(data.secret || "") !== String(CONFIG.getProperty("WEBHOOK_SECRET") || "")) {
    return { ok: false, error: "Unauthorized." };
  }

  const title = String(data.title || "a new note");
  const url = String(data.url || "https://www.ayushyadav.me/");
  const kind = String(data.kind || "note");
  const sheet = subscriberSheet_();
  const rows = sheet.getDataRange().getValues();
  const recipients = rows.slice(1)
    .map((row, index) => ({ email: String(row[0] || "").trim(), status: String(row[2] || "").toLowerCase(), row: index + 2 }))
    .filter(item => item.email && item.status === "active");

  recipients.forEach(item => {
    MailApp.sendEmail({
      to: item.email,
      name: "Ayush Notes",
      subject: "new " + kind + ": " + title,
      body: "A new " + kind + " is up: " + title + "\n\n" + url,
      htmlBody: '<p>A new ' + escapeHtml_(kind) + ' is up.</p><h2>' + escapeHtml_(title) + '</h2><p><a href="' + escapeAttribute_(url) + '">read it →</a></p>'
    });
    sheet.getRange(item.row, 5).setValue(new Date());
  });
  return { ok: true, sent: recipients.length };
}

function subscriberSheet_() {
  const spreadsheetId = CONFIG.getProperty("1BRpfw79WR-Oxwu5LKz3qAVrvLaazWvrwhzltEsV6u3w");
  if (!spreadsheetId) throw new Error("Set SPREADSHEET_ID in Script Properties.");
  const spreadsheet = SpreadsheetApp.openById(1BRpfw79WR-Oxwu5LKz3qAVrvLaazWvrwhzltEsV6u3w);
  const sheet = spreadsheet.getSheetByName("Subscribers") || spreadsheet.insertSheet("Subscribers");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Email", "Subscribed at", "Status", "Source", "Last notified at"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute_(value) {
  return escapeHtml_(value).replace(/"/g, "&quot;");
}
