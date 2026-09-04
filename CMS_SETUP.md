# Writings CMS setup

The public writing page is `/writings.html`; its entries live in `content/writings.json`.
The editor is `/admin/`, powered by Decap CMS. It signs in with GitHub and commits only to `main`.

## One-time setup

1. In GitHub, create an OAuth App at **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Homepage URL: `https://www.ayushyadav.me`
   - Authorization callback URL: `https://www.ayushyadav.me/api/callback`
2. Copy the OAuth App's Client ID and generate a Client Secret.
3. In Vercel, open the project for this site, then go to **Settings → Environment Variables**.
4. Add these variables for Production, Preview, and Development:
   - `GITHUB_OAUTH_CLIENT_ID`
   - `GITHUB_OAUTH_CLIENT_SECRET`
5. Redeploy the project, then visit `https://www.ayushyadav.me/admin/`.

Only GitHub users with write access to `ayushprv/portfolio` can publish. Never put the Client Secret into a committed file.
