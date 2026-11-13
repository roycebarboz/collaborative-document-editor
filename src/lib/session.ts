import { cookies } from "next/headers";
import { SEEDED_USERNAMES } from "./db";

export const SESSION_COOKIE = "user";

/** The signed-in User (a seeded username in the cookie), or null. */
export async function currentUser(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return (SEEDED_USERNAMES as readonly string[]).includes(value ?? "") ? value! : null;
}
