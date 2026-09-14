import { mora } from "./mora";
import { volt } from "./volt";
import { khesht } from "./khesht";
import { crush } from "./crush";
import { atria } from "./atria";
import { noir } from "./noir";
import { sunday } from "./sunday";
import { miette } from "./miette";
import { form } from "./form";
import { district } from "./district";
import type { DemoDefinition, DemoProduct } from "./types";

const baseDemos: DemoDefinition[] = [mora, volt, khesht, crush, atria, noir, sunday, miette, form, district];

const SAMPLE_ITEMS = [
  { slug: "saffron-chicken-rice", fa: "جوجه زعفرانی با برنج مجلسی", en: "Saffron Chicken & Jeweled Rice", descFa: "جوجه گریل‌شده، برنج زعفرانی، زرشک و پسته", descEn: "Charred saffron chicken, aromatic rice, barberries and pistachio", price: 485000, imageUrl: "/images/generated/saffron-chicken-rice.webp" },
  { slug: "pistachio-milkshake", fa: "میلک‌شیک پسته", en: "Pistachio Milkshake", descFa: "بستنی وانیلی، پسته تازه و خامه سبک", descEn: "Vanilla ice cream, fresh pistachio and light cream", price: 245000, imageUrl: "/images/generated/pistachio-milkshake.webp" },
  { slug: "chocolate-ganache-cake", fa: "کیک گاناش شکلاتی", en: "Chocolate Ganache Cake", descFa: "کیک شکلات تلخ با لایه گاناش براق", descEn: "Dark chocolate layer cake with glossy ganache", price: 225000, imageUrl: "/images/generated/chocolate-ganache-cake.webp" },
  { slug: "avocado-poached-eggs", fa: "تست آووکادو و تخم‌مرغ پوچ", en: "Avocado & Poached Eggs", descFa: "نان خمیرترش، آووکادو، تخم‌مرغ پوچ و سبزی تازه", descEn: "Sourdough, avocado, poached eggs and fresh herbs", price: 365000, imageUrl: "/images/generated/avocado-poached-eggs.webp" },
] as const;

function withTwentyProducts(demo: DemoDefinition): DemoDefinition {
  const current = demo.categories.reduce((total, category) => total + category.products.length, 0);
  const missing = Math.max(0, 20 - current);
  if (!missing) return demo;
  const products: DemoProduct[] = Array.from({ length: missing }, (_, index) => {
    const sample = SAMPLE_ITEMS[index % SAMPLE_ITEMS.length];
    const round = Math.floor(index / SAMPLE_ITEMS.length) + 1;
    const qualifierFa = round === 1 ? "" : round === 2 ? " ویژه" : " کوچک";
    const qualifierEn = round === 1 ? "" : round === 2 ? " — Signature" : " — Small Plate";
    return {
      slug: `${sample.slug}-${demo.id}-${index + 1}`,
      name: { fa: `${sample.fa}${qualifierFa}`, en: `${sample.en}${qualifierEn}` },
      description: { fa: sample.descFa, en: sample.descEn },
      price: round === 3 ? Math.round(sample.price * 0.72) : sample.price,
      badges: index === 0 ? ["new"] : undefined,
      imagePrompt: `Photorealistic menu photography of ${sample.en}; no text, logo or watermark.`,
      imageUrl: sample.imageUrl,
      imageThumbnailUrl: sample.imageUrl.replace(".webp", "-480.webp"),
    };
  });
  return {
    ...demo,
    categories: [
      ...demo.categories,
      { slug: "more-picks", name: { fa: "انتخاب‌های بیشتر", en: "More picks" }, description: { fa: "نمونه‌های بیشتر برای دیدن تنوع منو", en: "More samples to show the menu range" }, products },
    ],
  };
}

export const demos: DemoDefinition[] = baseDemos.map(withTwentyProducts);

export function getDemo(id: string): DemoDefinition | undefined {
  return demos.find((d) => d.id === id);
}

export function demoProductCount(d: DemoDefinition): number {
  return d.categories.reduce((n, c) => n + c.products.length, 0);
}

export function allDemoProducts(d: DemoDefinition): DemoProduct[] {
  return d.categories.flatMap((c) => c.products);
}

export type { DemoDefinition, DemoProduct };
