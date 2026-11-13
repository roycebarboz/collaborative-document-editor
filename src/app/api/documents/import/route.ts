import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { MAX_IMPORT_BYTES } from "@/lib/documents";

export async function POST(req: Request) {
  let file: FormDataEntryValue | null = null;
  try {
    // Reject oversized uploads before buffering them.
    if (Number(req.headers.get("content-length")) > MAX_IMPORT_BYTES + 64 * 1024)
      return NextResponse.json({ error: "That file is larger than the 1 MB import limit." }, { status: 400 });
    file = (await req.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Choose a .txt file to import." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a .txt file to import." }, { status: 400 });
  const upload = file;
  return withUser(
    async (user, docs) => docs.importTxt(user, { name: upload.name, bytes: new Uint8Array(await upload.arrayBuffer()) }),
    201,
  );
}
