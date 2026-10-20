# Application accounts and first login

## Account source

The application login uses `public.users` as defined in `src/db/schema.ts`:

- UUID `id`, used by sessions and Google Drive foreign keys.
- Work email and bcrypt password hash.
- Application role (`admin`, `technical`, or `sales`).

The inspected Neon branch also has legacy `public.tai_khoan` with username and hashed PIN fields, but it contained zero account rows. There is therefore no account data to map, and the PIN hash format cannot be verified. The application must not treat `pin_bam` as a bcrypt password or silently authenticate against the legacy table.

## First application admin

After the ordered migrations are successfully tested on staging, create the first application account with the existing `db:seed-admin` script. It requires `ADMIN_NAME`, `ADMIN_EMAIL`, and an `ADMIN_PASSWORD` of at least 12 characters, and writes a bcrypt hash to `users`.

Supply these values only to a trusted one-time execution environment. Do not commit them, put them in browser-side variables, share them in chat, or leave the admin password stored as a permanent Vercel environment variable. After seeding, sign in at `/login` with the chosen work email and password. The Drive connection flow is restricted to the `admin` role.

Do not run the seed script against Production until staging, backup/restore, and Production-target verification are complete. Never run it repeatedly to reset an account; it intentionally stops if that email already exists.
