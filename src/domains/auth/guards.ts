/**
 * Server-side route guards. Session read from cookies via Better Auth;
 * role checks are server-authoritative only.
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "./server";

export async function requireUser(nextPath = "/fa/dashboard") {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders }).catch(() => null);
  if (!session?.user) {
    const locale = nextPath.startsWith("/en/") || nextPath === "/en" ? "en" : "fa";
    redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
  }
  if ((session.user as { isSuspended?: boolean }).isSuspended) {
    const locale = nextPath.startsWith("/en/") || nextPath === "/en" ? "en" : "fa";
    redirect(`/${locale}/status/account-suspended`);
  }
  return session;
}

export async function requireAdmin(nextPath = "/fa/admin", allowedRoles?: string[]) {
  const session = await requireUser(nextPath);
  const role = (session.user as { role?: string }).role ?? "business";
  const permitted = allowedRoles ?? ["superadmin", "admin"];
  if (!permitted.includes(role)) {
    const locale = nextPath.startsWith("/en/") || nextPath === "/en" ? "en" : "fa";
    redirect(`/${locale}/dashboard`);
  }
  return { session, role };
}

/** Private owner/creator workspace. Superadmins retain access without a second account. */
export async function requireCreator(nextPath = "/fa/creator") {
  const session = await requireUser(nextPath);
  const role = (session.user as { role?: string }).role ?? "business";
  if (!["superadmin", "creator"].includes(role)) {
    const locale = nextPath.startsWith("/en/") || nextPath === "/en" ? "en" : "fa";
    redirect(`/${locale}/dashboard`);
  }
  return { session, role };
}
