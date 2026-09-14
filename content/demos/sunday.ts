import { prompt, type DemoDefinition } from "./types";

export const sunday: DemoDefinition = {
  id: "sunday",
  name: "Sunday",
  nameFa: "ساندی",
  tagline: {
    fa: "برانچ آفتابی و بازیگوش",
    en: "Sunlit, playful brunch",
  },
  bestFor: {
    fa: ["کافه برانچ", "صبحانه‌فروشی", "کافه خانوادگی"],
    en: ["Brunch café", "Breakfast spot", "Family café"],
  },
  characteristics: {
    fa: [
      "زرد کم‌رنگ / سفید / قهوه‌ای گرم",
      "کارت‌های روی‌هم چیده و تایم‌لاین صبح",
      "جزئیات انیمیشنی مواد اولیه",
      "حس روز تعطیل و آفتاب",
    ],
    en: [
      "Pale yellow / white / warm brown",
      "Stacked cards, morning timeline",
      "Animated ingredient details",
      "Weekend-morning feeling",
    ],
  },
  supportedFeatures: ["search", "favorites", "cart", "scheduled_menu", "pwa"],
  colorMode: "light",
  theme: {
    bg: "#fffbe8",
    card: "#ffffff",
    fg: "#4a3b28",
    muted: "#9c8a70",
    line: "#f2e9cf",
    accent: "#e8a33d",
    accentFg: "#4a3b28",
    fontFeel: "warm",
    radius: "18px",
  },
  categories: [
    {
      slug: "brunch",
      name: { fa: "برانچ", en: "Brunch" },
      icon: "egg",
      products: [
        { slug: "eggs-benedict", name: { fa: "اگ بندیکت", en: "Eggs Benedict" }, description: { fa: "تخم‌مرغ پوچ، سس هلندی‌ز، بیف دودی", en: "Poached eggs, hollandaise, smoked beef" }, price: 365000, badges: ["bestseller"], imagePrompt: prompt("eggs benedict with flowing hollandaise on english muffin", "stacked plating", "bright morning light", "linen and light wood", "4:3") },
        { slug: "scrambled-sourdough", name: { fa: "تخم‌مرغ بهم‌زده و سورود", en: "Scrambled Eggs & Sourdough" }, description: { fa: "کرمی با کره و پیازچه", en: "Creamy with chives" }, price: 285000, imagePrompt: prompt("creamy scrambled eggs on sourdough toast with chives", "soft plating", "morning light", "linen napkin", "4:3") },
        { slug: "turkish-eggs", name: { fa: "تخم‌مرغ تُرکی", en: "Turkish-Style Eggs" }, description: { fa: "ماست سیر و روغن فلفل", en: "Garlic yogurt, chili oil" }, price: 310000, imagePrompt: prompt("turkish eggs cilbir with garlic yogurt and chili oil swirl", "bowl plating", "bright light", "ceramic dish", "4:3") },
        { slug: "avocado-toast", name: { fa: "توست آواکادو", en: "Avocado Toast" }, description: { fa: "با تخم‌مرغ و دانه‌های رست", en: "Egg, seeded bread" }, price: 325000, imagePrompt: prompt("avocado toast with feta and seeded multigrain bread", "fresh look", "morning light", "light wood", "4:3") },
        { slug: "french-toast", name: { fa: "فرنچ توست", en: "French Toast" }, description: { fa: "بریوش، شیرهٔ افرا و توت", en: "Brioche, maple, berries" }, price: 315000, badges: ["new"], imagePrompt: prompt("brioche french toast with berries and maple syrup", "stacked", "bright light", "pale ceramic", "4:3") },
        { slug: "berry-pancakes", name: { fa: "پنکیک توت", en: "Berry Pancakes" }, description: { fa: "پنکیک با توت‌فرنگی و بلوبری", en: "Strawberry and blueberry" }, price: 325000, imagePrompt: prompt("fluffy pancakes with fresh berries and yogurt", "playful stack", "morning light", "pale yellow table", "4:3") },
        { slug: "granola-bowl", name: { fa: "گرانولا با یخ", en: "Granola Bowl" }, description: { fa: "گرانولا خانگی و ماست یونانی", en: "House granola, Greek yogurt" }, price: 265000, imagePrompt: prompt("granola bowl with greek yogurt berries and honey drizzle", "colorful", "morning light", "ceramic bowl", "4:3") },
        { slug: "breakfast-croissant", name: { fa: "کروسان صبحانه", en: "Breakfast Croissant" }, description: { fa: "تخم‌مرغ و پنیر در کروسان", en: "Egg and cheese croissant" }, price: 295000, imagePrompt: prompt("breakfast croissant sandwich with egg and cheese", "flaky layers", "bright light", "linen", "4:3") },
        { slug: "halloumi-sandwich", name: { fa: "ساندویچ حلومی", en: "Halloumi Sandwich" }, description: { fa: "حلومی گریل و سبزیجات", en: "Grilled halloumi, greens" }, price: 315000, imagePrompt: prompt("grilled halloumi sandwich with greens in artisan bread", "cross-section", "morning light", "wood board", "4:3") },
      ],
    },
    {
      slug: "drinks",
      name: { fa: "نوشیدنی", en: "Drinks" },
      icon: "cup-soda",
      products: [
        { slug: "orange-juice", name: { fa: "آب پرتقال طبیعی", en: "Fresh Orange Juice" }, description: { fa: "آب‌گیری لحظه‌ای", en: "Freshly squeezed" }, price: 185000, imagePrompt: prompt("fresh orange juice in glass with orange half beside", "pulp detail", "bright morning light", "pale table", "1:1") },
        { slug: "cappuccino", name: { fa: "کاپوچینو", en: "Cappuccino" }, description: { fa: "فوم ابریشمی", en: "Silky foam" }, price: 165000, imagePrompt: prompt("cappuccino with heart art in warm ceramic cup", "cozy", "morning light", "wooden table", "1:1") },
        { slug: "iced-latte", name: { fa: "لاته سرد", en: "Iced Latte" }, description: { fa: "شیر و اسپرسو روی یخ", en: "Milk and espresso over ice" }, price: 180000, imagePrompt: prompt("iced latte in tall glass with layers", "refreshing", "bright light", "pale table", "1:1") },
      ],
    },
  ],
};
