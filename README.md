# Flow

A minimal property preservation work order system with three roles: Authority (top-level,
settings + creates Vendor Managers), Vendor Manager (creates work orders and assigns them to
vendors), and Vendor (sees only their assigned work orders — instructions, PDF, pricing —
and uploads photos/documentation, which sync to Google Drive once configured).

## Stack

Next.js (App Router) + TypeScript + Tailwind, Prisma with PostgreSQL (via the `pg` driver
adapter), NextAuth v5 for auth. **This is the Netlify-ready variant** — it's identical to the
SQLite version except the database layer, so it works on serverless hosts with no persistent
disk.

## Running locally

You need a Postgres database first — a free one from [Neon](https://neon.tech) or
[Supabase](https://supabase.com) takes about a minute to set up. Copy its connection string
into `.env` as `DATABASE_URL`.

```bash
npm install
npx prisma migrate deploy   # applies the schema to your Postgres database
npx prisma db seed          # creates the first Authority login
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Default Authority login** (seeded, change the password after first login):
- Username: `owner`
- Password: `owner123`

Log in with that account, go to **Settings** to connect Google Drive, then use **Vendor
Managers** to create your first Vendor Manager account. That Vendor Manager then creates
Vendor accounts from their own **Vendors** tab. Nobody self-registers — every account is
created by the tier above it.

## How it works

- **Authority** (`/authority`): create Vendor Manager accounts, and — exclusively — access
  **Settings** (Google Drive connection, company name, support contact). Does not touch
  work orders.
- **Vendor Manager** (`/admin`): create/edit/delete work orders, assign a vendor, write
  instructions, attach an instruction PDF, add priced line items with a work order number,
  view uploaded photos/documents, print invoices, create Vendor accounts.
- **Vendor** (`/vendor`): see only work orders assigned to them, split into Open/Submitted
  tabs; view instructions, the PDF, and pricing; upload photos/documents; add notes/comments
  while working; mark a work order "Ready for Office" once at least one file is uploaded —
  after that it's read-only for them.
- **Uploads**: the first time a vendor uploads something on a work order, they're asked to
  confirm creating a folder named `{work order number} - {property address}`. Until Google
  Drive is configured (see below), that folder is created locally under `uploads/`. Once
  Drive is configured, new folders/uploads go there automatically — no code changes needed.
- **Login** is by username (not email) for all three roles — short, easy to type.

### Work order lifecycle

`OPEN` → `READY_FOR_OFFICE` → `COMPLETED`:

1. Vendor Manager creates a work order (`OPEN`) and assigns a vendor.
2. Vendor does the work, uploads photos, adds notes, and clicks **Mark Ready for Office** —
   the work order locks for them (`READY_FOR_OFFICE`).
3. Vendor Manager reviews it, submits it in the client portal, then clicks **Mark Complete**
   (`COMPLETED`) — this is the only way a Vendor Manager can close it out.
4. If something's wrong at either point, the Vendor Manager can click **Reopen** to send it
   back to `OPEN` so the vendor can fix it.

Completed work orders drop out of the default work order list but stay in the database
permanently — use the **Completed** or **All** tab to find them later.

## Connecting Google Drive

Log in as Authority and go to **Settings** — both the OAuth credentials and the destination
folder link are entered directly in that page, no `.env` editing required. See
[GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) for where to get each value. Until this is
done, uploads are stored locally and everything else works the same way.

## Deploying to Netlify

1. **Database**: create a Postgres database (Neon, Supabase, or Netlify DB all work) and
   copy its connection string.
2. **Push this project to a Git repo** (GitHub/GitLab/Bitbucket) — Netlify's Next.js runtime
   needs a connected repo to build correctly (server-rendered pages, API routes, and
   middleware don't work through a plain drag-and-drop zip upload, only through a proper
   build). Create a new repo and push this folder to it.
3. In Netlify: **Add new site → Import an existing project**, pick that repo. Netlify
   auto-detects Next.js via `netlify.toml` (already included here).
4. Under **Site settings → Environment variables**, add:
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — the value already in `.env` (or generate a new one)
   - `NEXTAUTH_URL` — your Netlify site URL, e.g. `https://your-site.netlify.app`
5. Deploy. Then run the schema against your production database once (from your machine,
   with `DATABASE_URL` pointed at production):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
6. Log in with the seeded Authority account (see above), go to **Settings**, and connect
   Google Drive — this matters more on Netlify than anywhere else, since there's no
   persistent disk for the local-storage fallback to write to.

## Project structure

- `src/app/authority/*` — Authority pages (Vendor Managers, Settings)
- `src/app/admin/*` — Vendor Manager pages (work orders, vendors)
- `src/app/vendor/*` — Vendor pages (their work orders)
- `src/app/api/*` — API routes (work orders, vendors, vendor-managers, settings, uploads,
  file serving)
- `src/lib/auth.ts` / `auth.config.ts` — NextAuth setup (split so middleware stays
  edge-runtime-safe)
- `src/lib/storage.ts` — upload storage abstraction (local disk now, Google Drive once
  configured)
- `src/lib/settings.ts` — site settings (Drive config, work order numbering, company info)
- `prisma/schema.prisma` — data model
