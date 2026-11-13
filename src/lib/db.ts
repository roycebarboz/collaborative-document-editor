import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

/** Minimal SQL interface shared by PGlite (dev/test) and Neon (production). */
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

export const SEEDED_USERNAMES = ["alice", "bob", "carol"] as const;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL REFERENCES users(username),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS shares (
  document_id TEXT NOT NULL REFERENCES documents(id),
  username TEXT NOT NULL REFERENCES users(username),
  PRIMARY KEY (document_id, username)
);
INSERT INTO users (username) VALUES ('alice'), ('bob'), ('carol') ON CONFLICT DO NOTHING;
`;

export function pgliteDb(pg: PGlite): Db {
  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const res = await pg.query(sql, params);
      return res.rows as T[];
    },
  };
}

export async function migrate(db: Db, pg?: PGlite): Promise<void> {
  if (pg) await pg.exec(SCHEMA);
  else for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await db.query(stmt);
}

/** In-memory database with schema and seeded users, for tests. */
export async function createTestDb(): Promise<Db> {
  const pg = new PGlite();
  const db = pgliteDb(pg);
  await migrate(db, pg);
  return db;
}

// Next bundles route handlers and server components separately, so a module-level variable
// would give each its own database. Keep the connection on globalThis so there is only one.
const globalForDb = globalThis as typeof globalThis & { __db?: Promise<Db> };

/** The app's database: Neon when DATABASE_URL is set, otherwise local PGlite. */
export function getDb(): Promise<Db> {
  globalForDb.__db ??= (async () => {
    if (process.env.DATABASE_URL) {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL);
      const db: Db = {
        async query<T>(text: string, params: unknown[] = []) {
          return (await sql.query(text, params)) as T[];
        },
      };
      await migrate(db);
      return db;
    }
    mkdirSync(".data", { recursive: true });
    const pg = new PGlite(".data/pglite");
    const db = pgliteDb(pg);
    await migrate(db, pg);
    return db;
  })();
  globalForDb.__db.catch(() => (globalForDb.__db = undefined));
  return globalForDb.__db;
}
