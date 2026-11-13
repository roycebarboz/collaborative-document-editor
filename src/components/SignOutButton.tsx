"use client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="btn"
      onClick={async () => {
        await fetch("/api/session", { method: "DELETE" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
