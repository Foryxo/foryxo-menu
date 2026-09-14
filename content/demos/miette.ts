import { prompt, type DemoDefinition } from "./types";

export const miette: DemoDefinition = {
  id: "miette",
  name: "Miette",
  nameFa: "میِت",
  tagline: {
    fa: "پاتی‌سری بوتیک، ظرافت اروپایی-ایرانی",
    en: "Boutique patisserie, European-Persian finesse",
  },
  bestFor: {
    fa: ["قنادی", "پاتی‌سری", "نان‌واژه"],
    en: ["Patisserie", "Bakery", "Dessert shop"],
  },
  characteristics: {
    fa: [
      "کریم صورتی / قهوه‌ای عمیق",
      "فونت سریف نمایشی",
      "عکس‌های ماکرو از لایه‌های شیرینی",
      "حرکت‌های ظریف و نرم",
    ],
    en: [
      "Blush cream / deep brown",
      "Serif display typography",
      "Macro pastry shots with visible layers",
      "Delicate, soft motion",
    ],
  },
  supportedFeatures: ["search", "favorites", "cart", "scheduled_menu", "analytics_lite"],
  colorMode: "light",
  theme: {
    bg: "#faf3ef",
    card: "#fffdfb",
    fg: "#3d2b22",
    muted: "#94796c",
    line: "#efdfd6",
    accent: "#c2704f",
    accentFg: "#fffdfb",
    fontFeel: "classic",
    radius: "16px",
  },
  categories: [
    {
      slug: "viennoiserie",
      name: { fa: "وی‌نوازری", en: "Viennoiserie" },
      icon: "croissant",
      products: [
        { slug: "butter-croissant", name: { fa: "کروسان کره‌ای", en: "Butter Croissant" }, description: { fa: "لایه‌های ترد کره‌ای", en: "Flaky butter layers" }, price: 145000, badges: ["bestseller"], imagePrompt: prompt("a golden butter croissant with visible flaky layers", "macro pastry shot", "soft daylight", "bakery counter marble", "4:3") },
        { slug: "almond-croissant", name: { fa: "کروسان بادام", en: "Almond Croissant" }, description: { fa: "کرم بادام و پودر قند", en: "Almond cream, icing sugar" }, price: 185000, imagePrompt: prompt("almond croissant with frangipane and sliced almonds", "macro detail", "soft light", "bakery marble", "4:3") },
        { slug: "pain-au-chocolat", name: { fa: "پن شوکولا", en: "Pain au Chocolat" }, description: { fa: "دو میله شکلات تلخ", en: "Two dark chocolate batons" }, price: 175000, imagePrompt: prompt("pain au chocolat with visible laminated layers and chocolate", "cross-section", "soft daylight", "bakery counter", "4:3") },
      ],
    },
    {
      slug: "eclairs-tarts",
      name: { fa: "اکلر و تارت", en: "Éclairs & Tarts" },
      icon: "cake",
      products: [
        { slug: "pistachio-eclair", name: { fa: "اکلر پسته", en: "Pistachio Éclair" }, description: { fa: "کرم پسته ایرانی", en: "Persian pistachio cream" }, price: 195000, badges: ["chef"], imagePrompt: prompt("pistachio eclair with green cream and crushed pistachios", "macro shot", "soft daylight", "blush marble", "4:3") },
        { slug: "chocolate-eclair", name: { fa: "اکلر شکلاتی", en: "Chocolate Éclair" }, description: { fa: "گاناش شکلات تلخ", en: "Dark chocolate ganache" }, price: 175000, imagePrompt: prompt("chocolate eclair with glossy ganache", "macro", "soft light", "bakery marble", "4:3") },
        { slug: "strawberry-tart", name: { fa: "تارت توت‌فرنگی", en: "Strawberry Tart" }, description: { fa: "کریم پاتی‌سری و توت تازه", en: "Pastry cream, fresh berries" }, price: 210000, imagePrompt: prompt("strawberry tart with glazed berries and pastry cream", "delicate plating", "soft light", "blush setting", "4:3") },
        { slug: "lemon-tart", name: { fa: "تارت لیمو", en: "Lemon Tart" }, description: { fa: "کریم لیمو با مرنگ", en: "Lemon curd, torched meringue" }, price: 185000, imagePrompt: prompt("lemon tart with torched meringue peaks", "elegant", "soft daylight", "bakery counter", "4:3") },
      ],
    },
    {
      slug: "cakes",
      name: { fa: "کیک و دسر", en: "Cakes & Desserts" },
      icon: "cake",
      products: [
        { slug: "basque-cheesecake", name: { fa: "چیزکیک باسک", en: "Basque Cheesecake" }, description: { fa: "سطح کاراملی، مرکز کرمی", en: "Burnt top, creamy heart" }, price: 210000, badges: ["bestseller"], imagePrompt: prompt("basque burnt cheesecake slice with creamy center", "rustic elegance", "soft light", "parchment and ceramic", "4:3") },
        { slug: "opera-cake", name: { fa: "اپرا کیک", en: "Opera Cake" }, description: { fa: "لایه‌های بادام، قهوه و شکلات", en: "Almond, coffee, chocolate layers" }, price: 225000, imagePrompt: prompt("opera cake slice showing precise gold-dusted layers", "architectural slice", "soft light", "marble", "4:3") },
        { slug: "cinnamon-roll", name: { fa: "رول دارچینی", en: "Cinnamon Roll" }, description: { fa: "با گلاس پنیر خامه‌ای", en: "Cream-cheese glaze" }, price: 165000, imagePrompt: prompt("cinnamon roll with dripping cream cheese glaze", "warm texture", "soft light", "bakery tray", "4:3") },
      ],
    },
    {
      slug: "bread",
      name: { fa: "نان", en: "Bread" },
      icon: "wheat",
      products: [
        { slug: "sourdough", name: { fa: "نان خمیرترش", en: "Sourdough Loaf" }, description: { fa: "خمیر مادر ۲۴ ساعته", en: "24h levain" }, price: 185000, imagePrompt: prompt("sourdough loaf with open crumb and scored crust", "bread ritual", "soft daylight", "flour-dusted wood", "4:3") },
        { slug: "baguette", name: { fa: "باگت", en: "Baguette" }, description: { fa: "پوسته ترد، مغز نرم", en: "Crisp crust, soft crumb" }, price: 95000, imagePrompt: prompt("crusty baguette with scoring marks", "rustic", "soft light", "linen and wood", "4:3") },
      ],
    },
  ],
};
