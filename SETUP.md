# Supabase setup

1. Supabase ▸ SQL Editor: paste and run `schema.sql`.
2. Edit `config.js` with your Project URL and publishable key (Project Settings ▸ API).
3. Open the site, click **Create Account** and register `admin@sweetflowergarden.com` (and/or your developer email).
4. Run the commented `update ... set role = 'admin'` line at the bottom of schema.sql.
5. Log in: admins go to the admin dashboard, sales accounts (created by the admin) to the sales dashboard, everyone else to the customer dashboard.

Authentication ▸ Providers ▸ Email: turn "Confirm email" off if you want new sales accounts to log in immediately.

The site uses ES modules, so open it through a web server (Netlify, GitHub Pages, `npx serve`, VS Code Live Server), not by double-clicking the .html files.

## Structure
- `*.html` markup only; `style.css` all styling
- `config.js` project URL + key, `supabase.js` the client
- `auth.js`, `bookings.js`, `gallery.js`, `dashboards.js`, `ui.js`, `main.js`
