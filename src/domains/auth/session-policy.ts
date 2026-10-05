export type ApiSessionFailure = {
  ok: false;
  error: "unauthorized" | "suspended";
  status: 401 | 403;
};

export function apiSessionFailure(
  session: { user?: { isSuspended?: boolean } } | null | undefined,
): ApiSessionFailure | null {
  if (!session?.user) return { ok: false, error: "unauthorized", status: 401 };
  if (session.user.isSuspended) return { ok: false, error: "suspended", status: 403 };
  return null;
}
