import { prompt, type DemoDefinition } from "./types";

export const volt: DemoDefinition = {
  id: "volt",
  name: "Volt",
  nameFa: "ولت",
  tagline: {
    fa: "کافه شهری، تیره و پرانرژی",
    en: "Urban café, dark and kinetic",
  },
  bestFor: {
    fa: ["کافه مدرن", "کافه‌بوک", "فضای کار و قهوه"],
    en: ["Modern café", "Coffee bar", "Laptop-friendly café"],
  },
  characteristics: {
    fa: [
      "تیره‌محور با اکسنت آبی الکتریکی",
      "تایپوگرافی جنبشی در هدر",
      "ناوبری افقی دسته‌ها",
      "کارت‌های ویژه با سوایپر",
    ],
    en: [
      "Dark-first with electric blue accents",
      "Kinetic typography header",
      "Horizontal category navigation",
      "Swiper feature cards",
    ],
  },
  supportedFeatures: ["search", "favorites", "cart", "whatsapp_order", "pwa", "analytics_lite"],
  colorMode: "dark",
  theme: {
    bg: "#0d1117",
    card: "#161c26",
    fg: "#e8ecf3",
    muted: "#8b96a8",
    line: "#242c39",
    accent: "#3b82f6",
    accentFg: "#0d1117",
    fontFeel: "bold",
    radius: "10px",
  },
  categories: [
    {
      slug: "coffee",
      name: { fa: "قهوه", en: "Coffee" },
      icon: "coffee",
      products: [
        { slug: "espresso", name: { fa: "اسپرسو", en: "Espresso" }, description: { fa: "شات کلاسیک با کرمای طلایی", en: "Classic shot, golden crema" }, price: 90000, imagePrompt: prompt("a double espresso with golden crema in a matte black cup", "low-angle dramatic shot", "moody light with subtle blue practical backlight", "dark urban café counter", "1:1") },
        { slug: "americano", name: { fa: "آمریکانو", en: "Americano" }, description: { fa: "صاف، تلخ و تمیز", en: "Clean and black" }, price: 120000, imagePrompt: prompt("an americano in a glass on dark metal table", "dramatic side light", "moody urban café", "blue practical lights bokeh", "1:1") },
        { slug: "latte", name: { fa: "لاته", en: "Latte" }, description: { fa: "ابریشمی و متعادل", en: "Silky and balanced" }, price: 165000, imagePrompt: prompt("a latte with bold heart art in a matte black cup", "45-degree shot", "moody contrast light", "dark wood counter", "1:1") },
        { slug: "caramel-latte", name: { fa: "لاته کارامل", en: "Caramel Latte" }, description: { fa: "شکر سوخته و شیر بخارداده", en: "Burnt sugar, steamed milk" }, price: 195000, badges: ["bestseller"], imagePrompt: prompt("a caramel latte with drizzle in a glass mug", "close-up of caramel drizzle", "moody warm light", "urban café table", "1:1") },
        { slug: "mocha", name: { fa: "موکا", en: "Mocha" }, description: { fa: "شکلات تلخ و اسپرسو", en: "Dark chocolate meets espresso" }, price: 195000, imagePrompt: prompt("a mocha with dark chocolate shavings on foam", "side view", "moody café light", "dark counter, blue bokeh", "1:1") },
      ],
    },
    {
      slug: "cold",
      name: { fa: "سرد", en: "Cold" },
      icon: "ice-cream",
      products: [
        { slug: "iced-americano", name: { fa: "آمریکانو سرد", en: "Iced Americano" }, description: { fa: "یخ کامل، تلخی تمیز", en: "Full ice, clean bitterness" }, price: 145000, imagePrompt: prompt("an iced americano in a tall glass with clear layering", "condensation detail", "moody blue-tinged light", "dark café table", "1:1") },
        { slug: "iced-latte", name: { fa: "لاته سرد", en: "Iced Latte" }, description: { fa: "لایه‌های شیر و اسپرسو", en: "Layered milk and espresso" }, price: 180000, imagePrompt: prompt("an iced latte with gradient milk-espresso layers in glass", "side view", "moody light", "urban café counter", "1:1") },
        { slug: "cold-brew-tonic", name: { fa: "کلد برو تونیک", en: "Cold Brew Tonic" }, description: { fa: "تونیک، یخ و پوست لیمو", en: "Tonic, ice, lemon peel" }, price: 220000, badges: ["new"], imagePrompt: prompt("a cold brew tonic with tonic water separation, ice and lemon peel", "backlit glass", "moody contrast", "dark bar counter", "1:1") },
        { slug: "matcha-latte", name: { fa: "ماچا لاته", en: "Matcha Latte" }, description: { fa: "ماچا اورگانیک و شیر بادام", en: "Organic matcha, almond milk" }, price: 225000, imagePrompt: prompt("a matcha latte with vibrant green layer over milk in glass", "side view", "moody light", "dark café table", "1:1") },
        { slug: "iced-matcha", name: { fa: "ماچا سرد", en: "Iced Matcha" }, description: { fa: "یخ و ماچا خالص", en: "Iced, pure matcha" }, price: 235000, imagePrompt: prompt("an iced matcha with vivid green over ice in tall glass", "backlit", "moody urban light", "dark counter", "1:1") },
      ],
    },
    {
      slug: "shakes",
      name: { fa: "شیک", en: "Shakes" },
      icon: "cup-soda",
      products: [
        { slug: "oreo-shake", name: { fa: "شیک اورو", en: "Oreo Shake" }, description: { fa: "بیسکویت، بستنی و خامه", en: "Cookie, ice cream, cream" }, price: 245000, badges: ["bestseller"], imagePrompt: prompt("an oreo shake in tall glass with whipped cream and cookie crumble", "close-up", "moody contrast light", "dark café table", "1:1") },
        { slug: "peanut-butter-shake", name: { fa: "شیک کره بادام‌زمینی", en: "Peanut Butter Shake" }, description: { fa: "پروتئین‌بار و غنی", en: "Rich and protein-loaded" }, price: 265000, imagePrompt: prompt("a peanut butter shake with drizzle inside glass", "side view", "moody light", "dark counter", "1:1") },
        { slug: "strawberry-shake", name: { fa: "شیک توت‌فرنگی", en: "Strawberry Shake" }, description: { fa: "توت‌فرنگی تازه", en: "Fresh strawberries" }, price: 235000, imagePrompt: prompt("a strawberry shake with fresh berries on cream", "natural color fruit", "moody light", "dark café table", "1:1") },
      ],
    },
    {
      slug: "snacks",
      name: { fa: "اسنک", en: "Snacks" },
      icon: "sandwich",
      products: [
        { slug: "chicken-panini", name: { fa: "پانینی مرغ", en: "Chicken Panini" }, description: { fa: "نان گریل‌شده، مرغ و پنیر", en: "Grilled bread, chicken, cheese" }, price: 295000, imagePrompt: prompt("a grilled chicken panini with visible grill marks and melted cheese", "cross-section stack", "moody warm light", "dark slate board", "4:3") },
        { slug: "turkey-croissant", name: { fa: "کروسان بوقلمون", en: "Turkey Croissant" }, description: { fa: "کروسان کره‌ای و سبزیجات", en: "Buttery croissant, greens" }, price: 275000, imagePrompt: prompt("a turkey croissant sandwich with fresh greens on wooden board", "45-degree", "moody light", "urban café table", "4:3") },
        { slug: "fries", name: { fa: "سیب‌زمینی سرخ‌کرده", en: "Fries" }, description: { fa: "ترد با نمک دریا", en: "Crispy, sea salt" }, price: 185000, imagePrompt: prompt("golden fries in metal cup with sea salt flakes", "appetizing close-up", "moody light", "dark counter", "4:3") },
      ],
    },
  ],
};
