import { createHash, timingSafeEqual } from "node:crypto";
export function authorized(
  header: string | undefined,
  expected = process.env.ADMIN_TOKEN,
): boolean {
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(header.slice(7)), digest(expected));
}
