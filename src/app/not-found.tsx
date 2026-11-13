import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page narrow">
      <h1>Document not found</h1>
      <p>It may not exist, or it hasn't been shared with you. Try signing in as a different user.</p>
      <Link href="/">Back to documents</Link>
    </main>
  );
}
