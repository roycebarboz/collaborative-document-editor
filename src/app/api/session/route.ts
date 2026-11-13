import { NextResponse } from "next/server";
import { SEEDED_USERNAMES } from "@/lib/db";
import { readJson, str } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const username = str((await readJson(req)).username);
  if (!username || !(SEEDED_USERNAMES as readonly string[]).includes(username))
    return NextResponse.json({ error: "Pick one of the listed users." }, { status: 400 });
  const res = NextResponse.json({ username });
  res.cookies.set(SESSION_COOKIE, username, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({});
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
