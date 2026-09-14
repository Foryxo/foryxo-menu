import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { demos } from "../content/demos";

const publicRoot = path.resolve(process.cwd(), "public");
const imageRoot = path.join(publicRoot, "images", "demos");

type ManifestItem = {
  demo: string;
  demoName: string;
  category: string;
  slug: string;
  name: { fa: string; en: string };
  description: { fa: string; en: string };
  priceToman: number;
  aspect: "1:1" | "4:3";
  sourcePath: string;
  imagePath: string;
  thumbnailPath: string;
  imagePrompt: string;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
};

function publicPath(...parts: string[]): string {
  return `/${path.posix.join(...parts)}`;
}

function requestedAspect(prompt: string): "1:1" | "4:3" {
  return /\b1:1 aspect ratio\b/i.test(prompt) ? "1:1" : "4:3";
}

async function main() {
  const manifest: ManifestItem[] = [];

  for (const demo of demos) {
    for (const category of demo.categories) {
      const categoryDir = path.join(imageRoot, demo.id, category.slug);
      await mkdir(categoryDir, { recursive: true });

      for (const product of category.products) {
        const aspect = requestedAspect(product.imagePrompt);
        if (product.imageUrl) {
          manifest.push({
            demo: demo.id,
            demoName: demo.name,
            category: category.slug,
            slug: product.slug,
            name: product.name,
            description: product.description,
            priceToman: product.price,
            aspect,
            sourcePath: product.imageUrl,
            imagePath: product.imageUrl,
            thumbnailPath: product.imageThumbnailUrl ?? product.imageUrl,
            imagePrompt: product.imagePrompt,
            width: 1200,
            height: 1200,
            thumbnailWidth: 480,
            thumbnailHeight: 480,
          });
          continue;
        }
        const sourceFile = path.join(categoryDir, `${product.slug}.png`);
        const imageFile = path.join(categoryDir, `${product.slug}.webp`);
        const thumbnailFile = path.join(categoryDir, `${product.slug}-480.webp`);
        await stat(sourceFile);

        const imageSize = aspect === "1:1"
          ? { width: 1000, height: 1000 }
          : { width: 1200, height: 900 };
        const thumbnailSize = aspect === "1:1"
          ? { width: 480, height: 480 }
          : { width: 480, height: 360 };

        await sharp(sourceFile)
          .rotate()
          .resize({ ...imageSize, fit: "cover", position: "centre" })
          .webp({ quality: 85, effort: 5 })
          .toFile(imageFile);

        await sharp(sourceFile)
          .rotate()
          .resize({ ...thumbnailSize, fit: "cover", position: "centre" })
          .webp({ quality: 80, effort: 5 })
          .toFile(thumbnailFile);

        manifest.push({
          demo: demo.id,
          demoName: demo.name,
          category: category.slug,
          slug: product.slug,
          name: product.name,
          description: product.description,
          priceToman: product.price,
          aspect,
          sourcePath: publicPath("images", "demos", demo.id, category.slug, `${product.slug}.png`),
          imagePath: publicPath("images", "demos", demo.id, category.slug, `${product.slug}.webp`),
          thumbnailPath: publicPath("images", "demos", demo.id, category.slug, `${product.slug}-480.webp`),
          imagePrompt: product.imagePrompt,
          ...imageSize,
          thumbnailWidth: thumbnailSize.width,
          thumbnailHeight: thumbnailSize.height,
        });
      }
    }
  }

  await writeFile(
    path.join(imageRoot, "manifest.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), count: manifest.length, items: manifest }, null, 2)}\n`,
    "utf8",
  );

  console.log(`Prepared ${manifest.length} demo products and wrote public/images/demos/manifest.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
