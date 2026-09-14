import { describe, expect, it } from "vitest";
import { localizedSafeNext } from "../../src/domains/i18n/safe-next";
import { safeMediaUrl } from "../../src/domains/storage/attachments";
import { additionalTableQrCodes } from "../../src/domains/qr/allowance";

describe("safe navigation and attachment links", () => {
  it("keeps post-login paths on-site and updates their language", () => {
    expect(localizedSafeNext("/en/creator/projects?tab=active", "fa")).toBe("/fa/creator/projects?tab=active");
    expect(localizedSafeNext("/fa/dashboard", "en")).toBe("/en/dashboard");
    expect(localizedSafeNext("//attacker.example/path", "en")).toBeNull();
    expect(localizedSafeNext("/\\attacker.example", "en")).toBeNull();
    expect(localizedSafeNext("javascript:alert(1)", "en")).toBeNull();
  });

  it("allows only app-served media paths from stored attachment records", () => {
    expect(safeMediaUrl("/api/media/customer/file.png")).toBe("/api/media/customer/file.png");
    expect(safeMediaUrl("https://menu.foryxo.com/api/media/customer/file.pdf")).toBe("/api/media/customer/file.pdf");
    expect(safeMediaUrl("https://attacker.example/api/media/file.png")).toBeNull();
    expect(safeMediaUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("paid table QR quantity", () => {
  it("counts only existing numbered codes in the selected branch and range", () => {
    const existing = [
      { branchId: "a", tableLabel: "1" },
      { branchId: "a", tableLabel: "3" },
      { branchId: "b", tableLabel: "2" },
      { branchId: null, tableLabel: null },
    ];
    expect(additionalTableQrCodes(existing, "a", 3)).toBe(1);
    expect(additionalTableQrCodes(existing, "b", 3)).toBe(2);
    expect(additionalTableQrCodes(existing, "a", 1)).toBe(0);
  });
});
