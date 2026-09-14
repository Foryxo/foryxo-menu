import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface DemoAsset {
  sourcePath: string;
  imagePath: string;
  thumbnailPath: string;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

const root = resolve(process.cwd(), "public");
const manifest = JSON.parse(
  readFileSync(resolve(root, "images/demos/manifest.json"), "utf8"),
) as { count: number; items: DemoAsset[] };

function diskPath(publicPath: string) {
  return resolve(root, publicPath.replace(/^\//, ""));
}

describe("demo food photography library", () => {
  it("contains a large, complete set of menu items", () => {
    expect(manifest.count).toBe(manifest.items.length);
    expect(manifest.items.length).toBeGreaterThanOrEqual(150);
  });

  it("has an original, optimized image, and thumbnail for every item", () => {
    for (const item of manifest.items) {
      for (const path of [item.sourcePath, item.imagePath, item.thumbnailPath]) {
        expect(existsSync(diskPath(path)), `missing ${path}`).toBe(true);
        expect(statSync(diskPath(path)).size, `empty ${path}`).toBeGreaterThan(1_000);
      }
      expect(item.width).toBeGreaterThanOrEqual(1_000);
      expect(item.height).toBeGreaterThanOrEqual(900);
      expect(item.thumbnailWidth).toBe(480);
      expect(item.thumbnailHeight).toBeGreaterThanOrEqual(360);
    }
  });
});
