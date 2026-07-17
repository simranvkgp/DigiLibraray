# DigiClass Library — Phase 1 + Phase 2

A digital library management system for schools, senior secondary schools, and universities. Built with Next.js (App Router) + TypeScript + Tailwind + Prisma/SQLite + Auth.js (Google-only OAuth), per spec.

## What's real and working

**From Phase 1:**
- Google OAuth via Auth.js, no email/password. Session carries role + approval status + category lock.
- Onboarding funnel (enforced in `middleware.ts`): sign in → registration form → pending approval → admin approves → **one-time, permanently locked** category choice → dashboard.
- Admin approval workflow: approve / reject / suspend / reactivate / delete, each logged to an `Approval` audit table.
- Full Prisma schema for every entity in the spec, written to be SQLite-today, Postgres-tomorrow.
- Book ingestion via Google Drive link (`lib/utils.ts#parseDriveLink`).
- User dashboard, searchable/sortable/grid-or-list library.
- Admin panel shell with Users and Books modules fully wired.
- Design system: exact palette, Fraunces/Inter/IBM Plex Mono type roles.

**New in Phase 2:**
- **Reader** (`/library/[id]`): page-by-page navigation (via Drive's `#page=N` deep link), zoom, fullscreen, dark mode (CSS-filter based, since the PDF itself renders in Google's iframe), bookmarking with a live sidebar, debounced reading-progress sync, and a download fallback for ZIP/SCORM packages that don't render inline.
- **Favorites**: real toggle on every book card, backed by `/api/favorites`.
- **Bookmarks**: page-specific, created from inside the reader, backed by `/api/bookmarks`.
- **Notifications**: admin composer (`/admin/notifications`) that broadcasts to all approved users or filters by category/board, backed by `/api/admin/notifications`; users see them on the dashboard.
- **Analytics** (`/admin/analytics`): real Recharts visualizations — daily logins (30 days), popular books, monthly activity — driven by live aggregation queries against `ActivityLog` and `Book`. Logins are now actually recorded on every sign-in.
- **Settings** (`/settings` for users, `/admin/settings` for admins): theme, language, and notification preferences, persisted per-user via `/api/settings`.
- **Boards & Categories admin CRUD** (`/admin/boards`, `/admin/categories`): add/delete, with delete blocked while books or users still reference the item.
- **Institutions** (`/admin/institutions`): read-only view (institutions are created implicitly at registration, so there's nothing to "add" here — this just surfaces them for reference).
- **Activity logs** (`/admin/logs`): filterable log viewer over the `ActivityLog` table.

## What's intentionally not built yet (Phase 3 roadmap)

1. **True in-browser PDF page rendering** — the reader currently embeds Google Drive's own PDF viewer in an iframe and drives it via the `#page=N` URL fragment. This works, but Drive's viewer is a black box: there's no in-book text search across it (cross-origin iframe, no scripting access) and "zoom" scales the whole iframe rather than re-rendering text. A pixel-perfect reader with real in-document search would mean rendering PDFs directly (e.g. pdf.js) instead of embedding Drive's viewer — a deliberate architecture decision I didn't want to make silently.
2. **SCORM runtime** — SCORM packages currently show a "download package" card rather than playing inline; embedding a SCORM player needs a specific library choice (e.g. scorm-again) and a hosting strategy for unzipped packages.
3. **Notification read/unread state in the UI** — the data model and API support it, but the dashboard doesn't yet have a "mark as read" affordance.
4. **Skeleton loaders / empty states / error pages** — present in the library grid and a few tables, not yet applied uniformly across every screen.

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, AUTH_SECRET
npm run db:push           # creates dev.db from the Prisma schema
npm run db:seed           # seeds categories, boards, and a sample book
npm run dev
```

**Google OAuth setup**: in Google Cloud Console, create an OAuth 2.0 Client ID (Web application), add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI, then put the client ID/secret in `.env`.

**Becoming an admin**: sign in once with your Google account (you'll land in the registration flow), then set `SEED_ADMIN_EMAIL=you@example.com` in `.env` and re-run `npm run db:seed` — this promotes that email to `SUPER_ADMIN` and auto-approves it.

## Migrating to PostgreSQL later

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Point `DATABASE_URL` at your Postgres instance.
3. Run `npx prisma migrate dev --name init`.

No model or query changes are needed — the schema was written to avoid SQLite-only types.

## Migrating storage from Google Drive to AWS S3 later

`Book.driveFileId/driveShareUrl/drivePreviewUrl/driveDownloadUrl` map cleanly to an S3-backed equivalent (`s3Key`, `s3Url`, signed preview/download URLs). Swap `lib/utils.ts#parseDriveLink` for an S3 upload handler and update the `Book` model's storage fields — the rest of the app (library, reader, admin) reads through those four URL fields regardless of where they point.

