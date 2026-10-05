export const REFUND_DECIDABLE_STATUSES = ["requested", "reviewing"] as const;

export function canDecideRefund(status: string): boolean {
  return (REFUND_DECIDABLE_STATUSES as readonly string[]).includes(status);
}

export function canPublishManagedContent(role: string): boolean {
  return role === "superadmin" || role === "admin";
}

export function removesActiveSuperadmin(input: {
  currentRole: string;
  currentlySuspended: boolean;
  nextRole: string;
  nextSuspended: boolean;
}): boolean {
  return (
    input.currentRole === "superadmin" &&
    !input.currentlySuspended &&
    (input.nextRole !== "superadmin" || input.nextSuspended)
  );
}

export interface AdminOverviewAccess {
  users: boolean;
  clients: boolean;
  menus: boolean;
  projects: boolean;
  requests: boolean;
  payments: boolean;
}

export function getAdminOverviewAccess(role: string): AdminOverviewAccess {
  if (role === "superadmin" || role === "admin") {
    return { users: true, clients: true, menus: true, projects: true, requests: true, payments: true };
  }
  if (role === "finance") {
    return { users: false, clients: false, menus: false, projects: false, requests: false, payments: true };
  }
  if (role === "support") {
    return { users: false, clients: true, menus: false, projects: true, requests: true, payments: false };
  }
  if (role === "editor") {
    return { users: false, clients: false, menus: true, projects: false, requests: false, payments: false };
  }
  return { users: false, clients: false, menus: false, projects: false, requests: false, payments: false };
}
