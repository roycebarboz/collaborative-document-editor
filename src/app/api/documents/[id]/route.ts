import { readJson, str, withUser } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return withUser((user, docs) => docs.get(user, id));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await readJson(req);
  return withUser((user, docs) => docs.save(user, id, { title: str(body.title), content: str(body.content) }));
}
