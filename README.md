# PK LASER OS

Production operating system for PK LASER technical service, machine management, KPI and commercial operations.

## Current foundation

- Cloudflare Pages + Functions
- Cloudflare D1 schema and migrations
- Real authentication with PBKDF2 password hashes
- HttpOnly/Secure session cookies
- Roles: `admin`, `technical`, `sales`
- Machine, service ticket, event-log, inventory and sales-lead tables
- Production login/dashboard shell
- `/api/health`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`

## Deploy foundation

1. Create a Cloudflare D1 database named `pk-laser-os`.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` with the real D1 database ID.
3. Apply `migrations/0001_init.sql` using Wrangler/D1 migrations.
4. Generate the first admin SQL locally without committing a password:

```bash
node tools/create-admin.mjs admin@your-domain.vn "PK LASER Admin" "YOUR-STRONG-PASSWORD"
```

5. Execute the printed SQL against the production D1 database.
6. Deploy the repository as a Cloudflare Pages project with `public` as the output directory and the D1 binding named `DB`.

## Next production slice

Machine Profile → QR identification → Service Ticket → technician assignment → ticket event timeline → KPI dashboard → diagnostic knowledge engine.
