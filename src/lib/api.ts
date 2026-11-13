import { NextResponse } from "next/server";
import { getDb } from "./db";
import { createDocumentsService, DocumentsError, type DocumentsService } from "./documents";
import { currentUser } from "./session";

const STATUS = { invalid: 400, forbidden: 403, not_found: 404 } as const;

/** Runs a route handler as the signed-in User and maps domain errors to JSON error responses. */
export async function withUser(
  fn: (user: string, docs: DocumentsService) => Promise<unknown>,
  status = 200,
): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    const docs = createDocumentsService(await getDb());
    return NextResponse.json(await fn(user, docs), { status });
  } catch (e) {
    if (e instanceof DocumentsError) return NextResponse.json({ error: e.message }, { status: STATUS[e.code] });
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/** Parses a JSON body, treating malformed input as an empty object. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown) => (typeof v === "string" ? v : undefined);
