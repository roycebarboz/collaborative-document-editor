import { readJson, str, withUser } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJson(req);
  return withUser(async (user, docs) => {
    await docs.share(user, id, str(body.username) ?? "");
    return docs.get(user, id);
  });
}
