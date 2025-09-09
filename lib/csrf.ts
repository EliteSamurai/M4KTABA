import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export function getCsrfToken(): string {
  const store = cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomBytes(16).toString("hex");
  store.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return token;
}

export function verifyCsrf(req: Request): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  const cookieToken = cookies().get(CSRF_COOKIE)?.value;
  const headerToken = headers().get(CSRF_HEADER);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function csrfHeader() {
  const token = getCsrfToken();
  return { [CSRF_HEADER]: token } as Record<string, string>;
}
