"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function NewDocumentControls() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(url: string, init: RequestInit) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(url, init);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(body.error ?? "Something went wrong. Please try again.");
      router.push(`/documents/${body.id}`);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="actions">
      <button
        className="btn primary"
        disabled={busy}
        onClick={() =>
          send("/api/documents", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title: "Untitled document" }),
          })
        }
      >
        New document
      </button>
      <label className="btn" htmlFor="import-file">
        Import .txt file
      </label>
      <input
        id="import-file"
        ref={fileRef}
        className="visually-hidden-input"
        type="file"
        accept=".txt,text/plain"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const form = new FormData();
          form.set("file", file);
          send("/api/documents/import", { method: "POST", body: form }).finally(() => {
            if (fileRef.current) fileRef.current.value = "";
          });
        }}
      />
      <span className="muted">Import accepts .txt files up to 1 MB.</span>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}
