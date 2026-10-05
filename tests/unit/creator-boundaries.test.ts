import { describe, expect, it } from "vitest";
import { apiSessionFailure } from "../../src/domains/auth/session-policy";
import { projectCanFundMenu } from "../../src/domains/qr/allowance";
import { canTransitionOrderStatus } from "../../src/domains/orders/transitions";
import { canAddChatAttachment } from "../../src/domains/messaging/attachments";

describe("creator API session policy", () => {
  it("rejects missing and suspended sessions but accepts active users", () => {
    expect(apiSessionFailure(null)).toEqual({ ok: false, error: "unauthorized", status: 401 });
    expect(apiSessionFailure({ user: { isSuspended: true } })).toEqual({ ok: false, error: "suspended", status: 403 });
    expect(apiSessionFailure({ user: { isSuspended: false } })).toBeNull();
  });
});

describe("table QR project entitlement", () => {
  it("accepts an explicit menu link and rejects a different menu", () => {
    expect(projectCanFundMenu("menu-a", "menu-a", 5)).toBe(true);
    expect(projectCanFundMenu("menu-a", "menu-b", 1)).toBe(false);
  });

  it("preserves only unambiguous single-menu legacy projects", () => {
    expect(projectCanFundMenu(null, "menu-a", 1)).toBe(true);
    expect(projectCanFundMenu(null, "menu-a", 2)).toBe(false);
    expect(projectCanFundMenu(null, "menu-a", 0)).toBe(false);
  });
});

describe("legacy order transitions", () => {
  it("allows placed orders to enter the normal processing flow", () => {
    expect(canTransitionOrderStatus("placed", "accepted")).toBe(true);
    expect(canTransitionOrderStatus("placed", "rejected")).toBe(true);
    expect(canTransitionOrderStatus("placed", "completed")).toBe(false);
  });
});

describe("chat attachment cap", () => {
  it("matches the API maximum of six files", () => {
    expect(canAddChatAttachment(5)).toBe(true);
    expect(canAddChatAttachment(6)).toBe(false);
    expect(canAddChatAttachment(7)).toBe(false);
  });
});
