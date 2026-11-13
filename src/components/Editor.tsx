"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor, useEditorState, type Editor as TipTapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { DocumentRecord } from "@/lib/documents";
import { SignOutButton } from "./SignOutButton";

type Status = "saved" | "unsaved" | "saving" | "error";

function ToolbarButton(props: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="tool"
      aria-label={props.label}
      title={props.label}
      aria-pressed={props.active ?? false}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function Toolbar({ editor }: { editor: TipTapEditor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
    }),
  });
  const run = () => editor.chain().focus();
  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <ToolbarButton label="Bold" active={s.bold} onClick={() => run().toggleBold().run()}><b>B</b></ToolbarButton>
      <ToolbarButton label="Italic" active={s.italic} onClick={() => run().toggleItalic().run()}><i>I</i></ToolbarButton>
      <ToolbarButton label="Underline" active={s.underline} onClick={() => run().toggleUnderline().run()}><u>U</u></ToolbarButton>
      <span className="sep" aria-hidden />
      <ToolbarButton label="Heading 1" active={s.h1} onClick={() => run().toggleHeading({ level: 1 }).run()}>H1</ToolbarButton>
      <ToolbarButton label="Heading 2" active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <span className="sep" aria-hidden />
      <ToolbarButton label="Bulleted list" active={s.bullet} onClick={() => run().toggleBulletList().run()}>• List</ToolbarButton>
      <ToolbarButton label="Numbered list" active={s.ordered} onClick={() => run().toggleOrderedList().run()}>1. List</ToolbarButton>
    </div>
  );
}

export function Editor({ doc, user }: { doc: DocumentRecord; user: string }) {
  const isOwner = doc.owner === user;
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState<Status>("saved");
  const [message, setMessage] = useState("");
  const [collaborators, setCollaborators] = useState(doc.collaborators);
  const [shareName, setShareName] = useState("");
  const [shareMsg, setShareMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const latest = useRef({ title: doc.title, dirty: false });

  const editor = useEditor({
    extensions: [StarterKit],
    content: doc.content,
    immediatelyRender: false,
    editorProps: { attributes: { "aria-label": "Document content", class: "prose" } },
    onUpdate: () => {
      latest.current.dirty = true;
      setStatus("unsaved");
    },
  });

  const save = useCallback(async () => {
    if (!editor) return;
    setStatus("saving");
    setMessage("");
    const content = editor.getHTML();
    const savedTitle = latest.current.title;
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: savedTitle, content }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(body.error ?? "Could not save. Please try again.");
        return;
      }
      latest.current.dirty = editor.getHTML() !== content || latest.current.title !== savedTitle;
      setStatus(latest.current.dirty ? "unsaved" : "saved");
    } catch {
      setStatus("error");
      setMessage("Network error. Your changes are not saved yet.");
    }
  }, [editor, doc.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (latest.current.dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [save]);

  async function share(e: React.FormEvent) {
    e.preventDefault();
    setShareMsg(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}/share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: shareName }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setShareMsg({ ok: false, text: body.error ?? "Could not share." });
      setCollaborators(body.collaborators);
      setShareMsg({ ok: true, text: `Shared with ${shareName.trim().toLowerCase()}.` });
      setShareName("");
    } catch {
      setShareMsg({ ok: false, text: "Network error. Please try again." });
    }
  }

  const statusText = {
    saved: "All changes saved",
    unsaved: "Unsaved changes",
    saving: "Saving…",
    error: "Not saved",
  }[status];

  return (
    <>
      <header className="bar">
        <Link href="/">← All documents</Link>
        <div className="bar-right">
          <span>
            Signed in as <strong>{user}</strong>
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="page editor-page">
        <div className="title-row">
          <label htmlFor="title" className="visually-hidden">Document title</label>
          <input
            id="title"
            className="title-input"
            value={title}
            maxLength={200}
            onChange={(e) => {
              setTitle(e.target.value);
              latest.current.title = e.target.value;
              latest.current.dirty = true;
              setStatus("unsaved");
            }}
          />
          <span className="badge">{isOwner ? "Owned by you" : `Shared by ${doc.owner}`}</span>
          <button className="btn primary" onClick={save} disabled={status === "saving"}>
            Save
          </button>
          <span className={`status ${status}`} role="status">{statusText}</span>
        </div>
        {message && <p role="alert" className="error">{message}</p>}
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
        <section className="share" aria-labelledby="share-h">
          <h2 id="share-h">Sharing</h2>
          <p>
            {collaborators.length
              ? `Collaborators: ${collaborators.join(", ")}`
              : "Not shared with anyone."}
          </p>
          {isOwner ? (
            <form onSubmit={share} className="share-form">
              <label htmlFor="share-user">Share with username</label>
              <input id="share-user" value={shareName} onChange={(e) => setShareName(e.target.value)} placeholder="e.g. bob" />
              <button className="btn" type="submit" disabled={!shareName.trim()}>Share</button>
              {shareMsg && (
                <p role={shareMsg.ok ? "status" : "alert"} className={shareMsg.ok ? "ok" : "error"}>{shareMsg.text}</p>
              )}
            </form>
          ) : (
            <p className="muted">Only the owner ({doc.owner}) can share this document. Access can't be revoked.</p>
          )}
        </section>
      </main>
    </>
  );
}
