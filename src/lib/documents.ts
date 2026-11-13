import { randomUUID } from "node:crypto";
import type { Db } from "./db";

export interface DocumentSummary {
  id: string;
  title: string;
  owner: string;
  updatedAt: string;
}

export interface DocumentRecord extends DocumentSummary {
  content: string;
  collaborators: string[];
}

export type ErrorCode = "invalid" | "not_found" | "forbidden";

export class DocumentsError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const MAX_TITLE_LENGTH = 200;
export const MAX_IMPORT_BYTES = 1024 * 1024;

const escapeHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function textToHtml(text: string): string {
  const paragraphs = text.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
}

export interface DocumentsService {
  /** Creates a new Document from an uploaded `.txt` file (max 1 MB). */
  importTxt(owner: string, file: { name: string; bytes: Uint8Array }): Promise<DocumentRecord>;
  /** Owner-only. Makes `target` a Collaborator; never revoked. */
  share(username: string, id: string, target: string): Promise<void>;
  get(username: string, id: string): Promise<DocumentRecord>;
  save(
    username: string,
    id: string,
    changes: { title?: string; content?: string },
  ): Promise<DocumentRecord>;
  create(owner: string, title: string, content?: string): Promise<DocumentRecord>;
  list(username: string): Promise<{ mine: DocumentSummary[]; shared: DocumentSummary[] }>;
}

interface Row {
  id: string;
  title: string;
  content: string;
  owner: string;
  updated_at: Date | string;
}

const toSummary = (r: Row): DocumentSummary => ({
  id: r.id,
  title: r.title,
  owner: r.owner,
  updatedAt: new Date(r.updated_at).toISOString(),
});

export function createDocumentsService(db: Db): DocumentsService {
  /** Loads a Document the User can access (Owner or Collaborator); otherwise it does not exist to them. */
  async function load(username: string, id: string): Promise<Row> {
    const [row] = await db.query<Row>(
      `SELECT d.* FROM documents d
       WHERE d.id = $1 AND (d.owner = $2 OR EXISTS
         (SELECT 1 FROM shares s WHERE s.document_id = d.id AND s.username = $2))`,
      [id, username],
    );
    if (!row) throw new DocumentsError("not_found", "Document not found.");
    return row;
  }

  async function record(row: Row): Promise<DocumentRecord> {
    const shares = await db.query<{ username: string }>(
      "SELECT username FROM shares WHERE document_id = $1 ORDER BY username",
      [row.id],
    );
    return { ...toSummary(row), content: row.content, collaborators: shares.map((x) => x.username) };
  }

  return {
    async get(username, id) {
      return record(await load(username, id));
    },

    async importTxt(owner, file) {
      if (!/\.txt$/i.test(file.name)) throw new DocumentsError("invalid", "Only .txt files can be imported.");
      if (file.bytes.byteLength > MAX_IMPORT_BYTES)
        throw new DocumentsError("invalid", "That file is larger than the 1 MB import limit.");
      const title = file.name.replace(/\.txt$/i, "").trim().slice(0, MAX_TITLE_LENGTH) || "Imported document";
      return this.create(owner, title, textToHtml(new TextDecoder().decode(file.bytes)));
    },

    async share(username, id, target) {
      const row = await load(username, id);
      if (row.owner !== username) throw new DocumentsError("forbidden", "Only the owner can share this document.");
      const name = target.trim().toLowerCase();
      if (name === username) throw new DocumentsError("invalid", "You already own this document.");
      const [user] = await db.query("SELECT 1 FROM users WHERE username = $1", [name]);
      if (!user) throw new DocumentsError("invalid", `No user named "${target.trim()}". Try alice, bob or carol.`);
      await db.query(
        "INSERT INTO shares (document_id, username) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, name],
      );
    },

    async save(username, id, changes) {
      const current = await load(username, id);
      let title = current.title;
      if (changes.title !== undefined) {
        title = changes.title.trim();
        if (!title) throw new DocumentsError("invalid", "Title cannot be empty.");
        if (title.length > MAX_TITLE_LENGTH)
          throw new DocumentsError("invalid", `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
      }
      const content = changes.content ?? current.content;
      const [row] = await db.query<Row>(
        "UPDATE documents SET title = $2, content = $3, updated_at = now() WHERE id = $1 RETURNING *",
        [id, title, content],
      );
      return record(row);
    },

    async create(owner, title, content = "") {
      title = title.trim() || "Untitled document";
      if (title.length > MAX_TITLE_LENGTH) throw new DocumentsError("invalid", `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
      const id = randomUUID();
      const [row] = await db.query<Row>(
        "INSERT INTO documents (id, title, content, owner) VALUES ($1, $2, $3, $4) RETURNING *",
        [id, title, content, owner],
      );
      return { ...toSummary(row), content: row.content, collaborators: [] };
    },

    async list(username) {
      const mine = await db.query<Row>(
        "SELECT * FROM documents WHERE owner = $1 ORDER BY updated_at DESC",
        [username],
      );
      const shared = await db.query<Row>(
        `SELECT d.* FROM documents d JOIN shares s ON s.document_id = d.id
         WHERE s.username = $1 ORDER BY d.updated_at DESC`,
        [username],
      );
      return { mine: mine.map(toSummary), shared: shared.map(toSummary) };
    },
  };
}
