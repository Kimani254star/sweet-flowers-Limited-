# Supabase setup

1. Supabase ▸ SQL Editor: paste and run `schema.sql`.
2. Edit `config.js` with your Project URL and publishable key (Project Settings ▸ API).
3. Create the admin and developer logins in Supabase (not on the website):
   Authentication ▸ Users ▸ **Add user ▸ Create new user**. Enter `ericksonmayeti@gmail.com` and a password, tick **Auto Confirm User**, then repeat for `mwangijosephk02@gmail.com` (`adminacaciabooks@gmail.com` already exists, so skip creating it).
   Then run the `update ... set role = 'admin'` block at the bottom of schema.sql.
4. Admin and developer now log in with the normal **Login** button and go to the admin dashboard. **Create Account** on the site is for customers only and always makes a customer.
5. Admin / developer adds everyone else from **Settings** in the admin dashboard: Sales, Customer Service, Accounts, Customers, or another Admin. (If you ran schema.sql before this update, run `roles-update.sql` once.)

Authentication ▸ Providers ▸ Email: turn "Confirm email" off if you want new sales accounts to log in immediately.

The site uses ES modules, so open it through a web server (Netlify, GitHub Pages, `npx serve`, VS Code Live Server), not by double-clicking the .html files.

## Password reset
Authentication ▸ URL Configuration: set **Site URL** to your live website address and add `https://YOUR-SITE/index.html` under **Redirect URLs**, otherwise the reset link will not bring people back to the site.

## Structure
- `*.html` markup only; `style.css` all styling
- `config.js` project URL + key, `supabase.js` the client
- `auth.js`, `bookings.js`, `gallery.js`, `dashboards.js`, `ui.js`, `main.js`
