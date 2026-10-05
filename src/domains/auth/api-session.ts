import { auth, type Session } from "./server";
import { apiSessionFailure, type ApiSessionFailure } from "./session-policy";

type ApiSessionSuccess = {
  ok: true;
  session: Session;
};

/** Authenticate API callers and reject suspended sessions before authorization or writes. */
export async function getActiveApiSession(
  requestHeaders: Headers,
): Promise<ApiSessionFailure | ApiSessionSuccess> {
  const session = await auth.api.getSession({ headers: requestHeaders }).catch(() => null);
  const failure = apiSessionFailure(session);
  return failure ?? { ok: true, session: session as Session };
}
