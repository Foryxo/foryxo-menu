/**
 * Routes account-only actions to the full-stack application when the public
 * marketing site is deployed as a static export. Full-stack deployments leave
 * NEXT_PUBLIC_ACCOUNT_APP_URL unset and keep navigation same-origin.
 */
export function accountUrl(pathname: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_ACCOUNT_APP_URL?.trim().replace(
    /\/$/,
    "",
  );

  if (!baseUrl) return pathname;
  return `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
