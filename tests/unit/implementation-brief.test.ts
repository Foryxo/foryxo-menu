import { describe, expect, it } from "vitest";
import { makeImplementationBrief } from "../../src/domains/builder/brief";

describe("creator implementation brief", () => {
  it("maps submitted choices and retains future fields losslessly", () => {
    const configuration = {
      demoId: "cafe",
      customBrief: "Warm editorial layout",
      languages: ["fa", "en"],
      features: ["online_ordering"],
      branchCount: 3,
      branchMenuMode: "unique",
      qrTableCount: 12,
      contentOption: "photos",
      photoCount: 24,
      domainOption: "own",
      domainName: "cafe.example",
      estimateAtSubmission: {
        initialTotal: 3_000_000,
        recurringAnnual: 500_000,
        lines: [{ key: "branches", amount: 1_000_000 }],
      },
      futureBuilderOption: { details: "preserve me" },
    };
    const brief = makeImplementationBrief({
      projectId: "project-1",
      submittedAt: new Date("2026-09-13T00:00:00.000Z"),
      status: "submitted",
      business: { id: "business-1", name: "کافه", nameEn: "Cafe", slug: "cafe", businessType: "cafe" },
      owner: { name: "Customer", email: "customer@example.com" },
      configuration,
      assets: [{ mediaId: "media-1", downloadUrl: "https://menu.foryxo.com/api/media/cafe/cake.jpg", filename: "cake.jpg", kind: "food_photo", dishOrAssetName: "Cake", customerInstructions: "Brighten", workflowStatus: "pending", mime: "image/jpeg", size: 1234 }],
    });

    expect(brief.branches).toMatchObject({ totalLocations: 3, menuMode: "unique" });
    expect(brief.functionality.permanentTableQrQuantity).toBe(12);
    expect(brief.menuContent.photosRequestedForEditing).toBe(24);
    expect(brief.hostingAndDomain.plannedMenuPath).toBe("/menus/cafe/menu");
    expect(brief.submittedEstimate.initialTotal).toBe(3_000_000);
    expect(brief.productionAssets[0].dishOrAssetName).toBe("Cake");
    expect(brief.productionAssets[0].downloadUrl).toContain("/api/media/");
    expect(brief.completeSubmittedSnapshot).toEqual(configuration);
  });
});
