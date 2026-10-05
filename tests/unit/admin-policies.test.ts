import { describe, expect, it } from "vitest";
import {
  canDecideRefund,
  canPublishManagedContent,
  getAdminOverviewAccess,
  removesActiveSuperadmin,
} from "../../src/domains/admin/policies";

describe("admin security policies", () => {
  it("allows refund decisions only while a refund is awaiting a decision", () => {
    expect(canDecideRefund("requested")).toBe(true);
    expect(canDecideRefund("reviewing")).toBe(true);
    expect(canDecideRefund("processing")).toBe(false);
    expect(canDecideRefund("completed")).toBe(false);
    expect(canDecideRefund("rejected")).toBe(false);
  });

  it("reserves managed-content publication for administrators", () => {
    expect(canPublishManagedContent("superadmin")).toBe(true);
    expect(canPublishManagedContent("admin")).toBe(true);
    expect(canPublishManagedContent("editor")).toBe(false);
    expect(canPublishManagedContent("creator")).toBe(false);
  });

  it("detects changes that remove an active superadmin", () => {
    expect(removesActiveSuperadmin({ currentRole: "superadmin", currentlySuspended: false, nextRole: "admin", nextSuspended: false })).toBe(true);
    expect(removesActiveSuperadmin({ currentRole: "superadmin", currentlySuspended: false, nextRole: "superadmin", nextSuspended: true })).toBe(true);
    expect(removesActiveSuperadmin({ currentRole: "superadmin", currentlySuspended: false, nextRole: "superadmin", nextSuspended: false })).toBe(false);
    expect(removesActiveSuperadmin({ currentRole: "admin", currentlySuspended: false, nextRole: "admin", nextSuspended: true })).toBe(false);
  });

  it("scopes overview data to each staff role", () => {
    expect(getAdminOverviewAccess("finance")).toEqual({ users: false, clients: false, menus: false, projects: false, requests: false, payments: true });
    expect(getAdminOverviewAccess("support")).toEqual({ users: false, clients: true, menus: false, projects: true, requests: true, payments: false });
    expect(getAdminOverviewAccess("editor")).toEqual({ users: false, clients: false, menus: true, projects: false, requests: false, payments: false });
    expect(getAdminOverviewAccess("business")).toEqual({ users: false, clients: false, menus: false, projects: false, requests: false, payments: false });
    expect(getAdminOverviewAccess("admin")).toEqual({ users: true, clients: true, menus: true, projects: true, requests: true, payments: true });
  });
});
