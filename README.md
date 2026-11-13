# Documents

A lightweight collaborative document editor: write rich-text documents, import a `.txt` file, and share documents with other users. See `GLOSSARY.md` for the domain terms and `ARCHITECTURE.md` for design decisions.

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # automated tests
npm run typecheck
```

No database setup is needed locally: data is stored in an embedded Postgres (PGlite) under `.data/` (delete that folder to reset).

## Deploy (Vercel + Neon)

1. Create a free Neon Postgres database and copy its connection string.
2. Import the repo in Vercel and set the `DATABASE_URL` environment variable.
3. Deploy. Tables and the three users are created automatically on first request.

## Reviewing the product

Sign in as **alice**, **bob** or **carol** (no passwords). Suggested flow: sign in as alice → New document → format text → Save (button or Ctrl/Cmd+S) → rename → Import a `.txt` → share with `bob` → sign out → sign in as bob → open it under "Shared with me" → edit and save → refresh.

## Scope

Working: create, rename, edit (bold, italic, underline, H1/H2, bulleted and numbered lists), explicit save with unsaved-changes indicator, reopen; `.txt` import (1 MB max, stated in the UI); sharing by username (owner only); "My documents" vs "Shared with me" with the owner shown; persistence; validation and error messages.

Deliberately not built: real-time collaboration, auto-save, conflict detection (last save wins), revoking a share, roles, deleting documents, `.md`/`.docx` import, real authentication (sign-in is pick-a-user).

## Tests

`src/lib/documents.test.ts` exercises the documents service (create, save/reopen, access, sharing rules, import) against an in-memory Postgres. The editor UI was not covered by automated tests.
