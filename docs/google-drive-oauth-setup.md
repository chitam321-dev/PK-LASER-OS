# PK LASER OS — Google Drive OAuth setup

## Scope and safety

- OAuth scope is `https://www.googleapis.com/auth/drive.readonly`, plus `openid email` to identify the connected account.
- Only a signed-in `admin` role can start OAuth, view connection status, or trigger manual metadata sync.
- Access and refresh tokens are encrypted with AES-256-GCM before they are stored in PostgreSQL.
- The sync endpoint lists metadata for non-trashed files across the connected Drive, up to 5,000 files per request. If more remain, it reports `truncated: true`; run sync again to continue.
- A changed Drive revision resets the metadata record's review state to `pending`.
- This implementation synchronizes file metadata only. It does not download document contents, extract text, build embeddings, or make files available to AI. Those steps require the approved ingestion worker and a human review UI.
- Never enable AI retrieval from these metadata records. Only separately extracted and explicitly approved knowledge items may be used by AI.
- The ChatGPT Google Drive connector is a separate product integration. This app's OAuth integration does not unlock a connector reported as `DISABLED_BY_ADMIN`.

## Google Cloud setup (personal Gmail)

1. Create/select a Google Cloud project for PK LASER OS.
2. Enable the Google Drive API.
3. Configure Google Auth Platform / OAuth consent screen for an External app and add the owner's Gmail address as a test user.
4. Add the scopes `https://www.googleapis.com/auth/drive.readonly`, `openid`, and `email`.
5. Create an OAuth Client ID of type **Web application**.
6. Register the exact redirect URI:
   `https://YOUR-DEPLOYMENT-DOMAIN/api/integrations/google-drive/callback`
   Replace the placeholder with the real HTTPS deployment origin. Do not guess this value.
7. Add these variables to the server-side environment only:
   - `GOOGLE_DRIVE_CLIENT_ID`
   - `GOOGLE_DRIVE_CLIENT_SECRET`
   - `GOOGLE_DRIVE_REDIRECT_URI` (must exactly match the registered URI)
   - `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY` (32 random bytes, base64-encoded; generate with `openssl rand -base64 32`)
8. Do not put any of these values in client-side variables, source control, chat, logs, or screenshots.

## Database migration gate

The SQL draft at `docs/migrations/20261020_google_drive_integration.sql` is not applied automatically. Review it and apply to a non-production database first. Do not run it against production without explicit owner approval and a backup.

## Application flow

1. A logged-in admin visits `/api/integrations/google-drive/connect`.
2. Google prompts the admin to consent.
3. Google redirects to `/api/integrations/google-drive/callback`.
4. The callback validates one-time state, exchanges the code, verifies the account through Drive `about`, encrypts the token bundle, and stores it.
5. Admin can inspect `GET /api/integrations/google-drive/status`.
6. Admin can call `POST /api/integrations/google-drive/sync` to scan file metadata. This endpoint does not download contents.

## Limitations before production

- Confirm the actual deployment hostname and register the callback.
- Review the Google OAuth restricted-scope verification requirements for the intended deployment and user base.
- Add rate limiting and an audit log before production use.
- Implement document-content ingestion in a sandbox, malware/ZIP-bomb limits, parser limits, deletion/retention handling, and the human review UI.
- Test revoked consent, missing refresh token, token expiry, large Drives, API quota errors, and concurrent syncs.
- Review OAuth token rotation and account disconnect/revocation behavior.
- The current sync uses a 5,000-file cap per request and has no persisted page cursor. Repeated runs begin at the start; implement a persisted cursor before using it on very large Drives.
