import { readJson, str, withUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = () => withUser((user, docs) => docs.list(user));

export async function POST(req: Request) {
  const body = await readJson(req);
  return withUser((user, docs) => docs.create(user, str(body.title) ?? ""), 201);
}
