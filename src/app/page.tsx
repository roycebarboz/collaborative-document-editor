import Link from "next/link";
import { getDb } from "@/lib/db";
import { createDocumentsService, type DocumentSummary } from "@/lib/documents";
import { currentUser } from "@/lib/session";
import { SignIn } from "@/components/SignIn";
import { SignOutButton } from "@/components/SignOutButton";
import { NewDocumentControls } from "@/components/NewDocumentControls";

export const dynamic = "force-dynamic";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";

function DocumentList({ docs, showOwner, empty }: { docs: DocumentSummary[]; showOwner?: boolean; empty: string }) {
  if (!docs.length) return <p className="muted">{empty}</p>;
  return (
    <ul className="doc-list">
      {docs.map((d) => (
        <li key={d.id}>
          <Link href={`/documents/${d.id}`}>{d.title}</Link>
          <span className="muted">
            {showOwner && <>Owner: {d.owner} · </>}Edited {fmt(d.updatedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function Home() {
  const user = await currentUser();
  if (!user) return <SignIn />;
  const { mine, shared } = await createDocumentsService(await getDb()).list(user);
  return (
    <>
      <header className="bar">
        <h1>Documents</h1>
        <div className="bar-right">
          <span>
            Signed in as <strong>{user}</strong>
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="page">
        <NewDocumentControls />
        <section aria-labelledby="mine">
          <h2 id="mine">My documents</h2>
          <DocumentList docs={mine} empty="You haven't created any documents yet." />
        </section>
        <section aria-labelledby="shared">
          <h2 id="shared">Shared with me</h2>
          <DocumentList docs={shared} showOwner empty="Nothing has been shared with you yet." />
        </section>
      </main>
    </>
  );
}
