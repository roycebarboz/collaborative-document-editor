"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const USERS = ["alice", "bob", "carol"];

export function SignIn() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function signIn(username: string) {
    setError("");
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (res.ok) router.refresh();
    else setError((await res.json()).error ?? "Could not sign in.");
  }

  return (
    <main className="page narrow">
      <h1>Documents</h1>
      <p>Choose a user to continue. There are no passwords; these are demo users.</p>
      <ul className="user-list">
        {USERS.map((u) => (
          <li key={u}>
            <button className="btn" onClick={() => signIn(u)}>
              Sign in as {u}
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="error">{error}</p>}
    </main>
  );
}
