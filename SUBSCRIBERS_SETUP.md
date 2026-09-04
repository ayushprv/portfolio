# Subscriber automation setup

This repository contains the website code and the Google Apps Script that owns the subscriber list.

1. Create a Google Sheet named `Ayush Notes Subscribers`.
2. In that Sheet, open **Extensions → Apps Script**.
3. Replace the default file with `apps-script/Code.gs` from this repository.
4. In **Project Settings → Script Properties**, add:
   - `SPREADSHEET_ID`: the identifier from the Google Sheet URL.
   - `WEBHOOK_SECRET`: a long random value.
5. Deploy it as a **Web app**. Set access to **Anyone** and copy the deployment URL.
6. In Vercel, add `APPS_SCRIPT_URL` with that deployment URL.
7. In GitHub repository secrets, add:
   - `APPS_SCRIPT_URL`: the same deployment URL.
   - `SUBSCRIBER_WEBHOOK_SECRET`: the exact secret from step 4.

The Sheet is created with a `Subscribers` tab on the first sign-up. Every new subscriber receives a welcome email. Any CMS publish that changes gallery or writing content triggers the GitHub workflow and emails all active subscribers.