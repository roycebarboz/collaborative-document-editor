# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) with route handlers and plain SQL. Neon Postgres in production on Vercel; PGlite (in-process Postgres) for local dev and tests. TipTap rich-text editor. Vitest. Decided in the planning session; see `GLOSSARY.md` for domain terms.

## Users

Assessment reviewers at Ajaia evaluating a take-home submission. They arrive cold, have a few minutes, and click through the live deployment to confirm each required capability works end to end, then switch between seeded users to verify sharing. They are not daily users; there is no secondary audience to design for.

## Product Purpose

A lightweight collaborative document editor that proves a coherent, working product slice: create, rename, edit, save and reopen rich-text Documents; Import a `.txt` file as a new Document; Share a Document with another User; everything persists across refresh. Success means a reviewer can verify every required item without instructions beyond the README and seeded credentials.

## Positioning

Deliberately minimal: depth on the required flows over breadth. Every scope cut is intentional and stated in the README rather than hidden.

## Operating Context

- Reviewers use a desktop browser against the live Vercel URL, possibly in two windows or by signing out and back in as another User.
- Sign-in is a pick-a-user screen with three seeded Users: alice, bob, carol. No passwords.
- The flow a reviewer will follow: sign in as alice → create a Document → format text → save → rename → Import a `.txt` → Share with bob → sign in as bob → see it under "Shared with me" → edit → refresh and confirm persistence.

## Capabilities and Constraints

- Formatting: bold, italic, underline, headings, bulleted and numbered lists. Content stored as HTML.
- Saving is explicit (Save button and Ctrl/Cmd+S) with an unsaved-changes indicator. Concurrent edits: last save wins.
- Import: `.txt` only, 1 MB max; the limit must be stated in the UI.
- Sharing: only the Owner can Share, by username. Collaborators can edit and rename but cannot re-share. Shares cannot be revoked. No delete.
- The dashboard separates "My documents" from "Shared with me", showing the Owner on shared items.
- Out of scope: real-time collaboration, revoke, roles, delete, autosave, conflict detection, `.md`/`.docx` import.
- Product name: none. The UI uses no product name or branding, and must not imitate Ajaia's branding.

## Evidence on Hand

None. No logos, brand assets, testimonials, or real content exist; do not fabricate any. Seeded Users and any sample Documents are clearly fictional.

## Product Principles

1. Every required capability is discoverable within seconds by someone who has never seen the app.
2. State is always legible: who you are signed in as, whether changes are saved, and whether a Document is yours or shared with you.
3. Errors explain what happened and what to do next, especially for unsupported files and unknown usernames.
4. Prefer familiar document-editor conventions over novelty; the reviewer should spend attention on the work, not the interface.

## Accessibility & Inclusion

WCAG 2.2 AA basics: full keyboard operation of the editor toolbar and all actions, visible focus states, AA contrast, and labelled controls (including toolbar buttons with accessible names and pressed state).
