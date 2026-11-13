# Architecture note

- **Stack**: Next.js (App Router) with route handlers, plain SQL, TipTap editor. One deployable unit on Vercel.
- **Storage**: Postgres everywhere. Neon in production (`DATABASE_URL`), PGlite locally and in tests, behind a one-method `Db` interface, so the same SQL and schema run in both.
- **Domain logic lives in one module**, `src/lib/documents.ts` (`createDocumentsService(db)`): ownership, collaborator access, sharing rules, import and validation. Route handlers are thin: resolve the signed-in user, call the service, map `DocumentsError` codes to HTTP status. This is also the test seam.
- **Access model**: a User who is neither Owner nor Collaborator gets "not found" (existence isn't leaked). Only the Owner can share; shares are never revoked.
- **Content** is stored as the editor's HTML. TipTap only parses nodes in its schema, so unknown markup is dropped on load. Imported text is HTML-escaped.
- **Auth** is a deliberately simple cookie holding a seeded username; it is not secure and is meant for demo use only.
- **Prioritised**: the required flows done end to end, with clear errors, over breadth. Cuts are listed in the README.
