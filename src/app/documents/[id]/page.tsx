import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createDocumentsService, DocumentsError } from "@/lib/documents";
import { currentUser } from "@/lib/session";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/");
  const { id } = await params;
  try {
    const doc = await createDocumentsService(await getDb()).get(user, id);
    return <Editor doc={doc} user={user} />;
  } catch (e) {
    if (e instanceof DocumentsError) notFound();
    throw e;
  }
}
