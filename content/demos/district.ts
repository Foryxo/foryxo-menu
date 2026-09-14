import { prompt, type DemoDefinition } from "./types";

export const district: DemoDefinition = {
  id: "district",
  name: "District",
  nameFa: "دیسکت",
  tagline: {
    fa: "منوی بزرگ، همه‌چیزخور، حداکثر امکانات",
    en: "Large menu, maximum functionality",
  },
  bestFor: {
    fa: ["فودکورت", "منوی بزرگ", "کافه‌رستوران بزرگ"],
    en: ["Food hall", "Large menu", "Big café-restaurant"],
  },
  characteristics: {
    fa: [
      "ناوبری دسته‌های چسبان برای منوهای بزرگ",
      "جستجوی سریع و فیلتر",
      "پیشنهاد هوشمند upsell",
      "شخصی‌سازی کامل سفارش (بدون پیاز، سس جدا و…)",
    ],
    en: [
      "Sticky category nav for large menus",
      "Fast search and filters",
      "Smart upsell suggestions",
      "Full order customization (no onions, side sauce…)",
    ],
  },
  supportedFeatures: ["search", "favorites", "cart", "modifiers", "custom_request", "whatsapp_order", "direct_order", "table_qr", "call_waiter", "discounts", "upsell", "analytics_lite", "multiple_branches"],
  colorMode: "system",
  theme: {
    bg: "#f6f7f9",
    card: "#ffffff",
    fg: "#1b1e24",
    muted: "#5d6675",
    line: "#e5e8ee",
    accent: "#f0642f",
    accentFg: "#ffffff",
    darkBg: "#101318",
    darkCard: "#181d26",
    darkFg: "#e9ecf2",
    darkMuted: "#8c96a6",
    darkLine: "#262d39",
    darkAccent: "#ff7a45",
    fontFeel: "modern",
    radius: "12px",
  },
  categories: [
    {
      slug: "breakfast",
      name: { fa: "صبحانه", en: "Breakfast" },
      icon: "egg",
      daypart: { start: "07:00", end: "12:00" },
      products: [
        { slug: "persian-breakfast-board", name: { fa: "صبحانه ایرانی", en: "Persian Breakfast Board" }, description: { fa: "پنیر، گردو، عسل، کره و نان تازه", en: "Cheese, walnuts, honey, butter, fresh bread" }, price: 385000, badges: ["bestseller"], imagePrompt: prompt("persian breakfast board with feta walnuts honey butter and bread", "generous board", "morning light", "wooden table", "4:3") },
        { slug: "omelette", name: { fa: "املت", en: "Omelette" }, description: { fa: "با انتخاب فیلینگ", en: "Choose your filling" }, price: 245000, allowsCustomRequest: true, imagePrompt: prompt("a folded omelette with herbs on plate", "clean plating", "morning light", "casual table", "4:3") },
        { slug: "pancakes", name: { fa: "پنکیک", en: "Pancakes" }, description: { fa: "سه لایه با شیره", en: "Three stacks, syrup" }, price: 295000, imagePrompt: prompt("pancake stack with syrup pour", "warm", "morning light", "casual table", "4:3") },
      ],
    },
    {
      slug: "cafe",
      name: { fa: "کافه", en: "Café" },
      icon: "coffee",
      products: [
        { slug: "espresso", name: { fa: "اسپرسو", en: "Espresso" }, description: { fa: "شات کوتاه", en: "Short shot" }, price: 95000, allowsCustomRequest: true, imagePrompt: prompt("espresso with crema in small cup", "warm", "natural light", "casual café", "1:1") },
        { slug: "latte", name: { fa: "لاته", en: "Latte" }, description: { fa: "با شیر دلخواه", en: "Your choice of milk" }, price: 175000, allowsCustomRequest: true, imagePrompt: prompt("latte with art in ceramic cup", "cozy", "natural light", "café table", "1:1") },
        { slug: "matcha", name: { fa: "ماچا", en: "Matcha" }, description: { fa: "خالص یا لاته", en: "Pure or latte" }, price: 225000, imagePrompt: prompt("matcha in ceramic cup", "vibrant green", "natural light", "café", "1:1") },
      ],
    },
    {
      slug: "burgers",
      name: { fa: "برگر", en: "Burgers" },
      icon: "beef",
      products: [
        { slug: "smash-burger", name: { fa: "اسمش برگر", en: "Smash Burger" }, description: { fa: "پتی اسمش، پنیر، سس", en: "Smashed patty, cheese, sauce" }, price: 295000, badges: ["bestseller"], allowsCustomRequest: true, imagePrompt: prompt("smash burger cross-section with melted cheese", "commercial", "bright light", "casual surface", "1:1") },
        { slug: "crispy-chicken", name: { fa: "چیزکن ترد", en: "Crispy Chicken" }, description: { fa: "سوخاری با سس", en: "Crispy with sauce" }, price: 315000, allowsCustomRequest: true, imagePrompt: prompt("crispy chicken burger with golden crust", "commercial", "bright light", "casual surface", "1:1") },
      ],
    },
    {
      slug: "pizza",
      name: { fa: "پیتزا", en: "Pizza" },
      icon: "pizza",
      products: [
        { slug: "margherita", name: { fa: "مارگاریتا", en: "Margherita" }, description: { fa: "کلاسیک با ریحان", en: "Classic with basil" }, price: 395000, allowsCustomRequest: true, imagePrompt: prompt("margherita pizza with basil", "rustic", "bright light", "wood surface", "1:1") },
        { slug: "beef-pepperoni", name: { fa: "پپرونی گوشت", en: "Beef Pepperoni-Style" }, description: { fa: "پپرونی گوشت", en: "Beef pepperoni" }, price: 475000, allowsCustomRequest: true, imagePrompt: prompt("beef pepperoni pizza with curled pepperoni", "commercial", "bright light", "rustic wood", "1:1") },
      ],
    },
    {
      slug: "persian",
      name: { fa: "ایرانی", en: "Persian" },
      icon: "utensils",
      products: [
        { slug: "joojeh-kebab", name: { fa: "جوجه کباب", en: "Joojeh Kebab" }, description: { fa: "زعفرانی با برنج", en: "Saffron with rice" }, price: 520000, allowsCustomRequest: true, imagePrompt: prompt("joojeh kebab saffron chicken skewers with rice", "persian ceramic", "warm light", "persian setting", "4:3") },
        { slug: "koobideh", name: { fa: "کوبیده", en: "Koobideh" }, description: { fa: "دو سیخ با برنج", en: "Two skewers with rice" }, price: 495000, allowsCustomRequest: true, imagePrompt: prompt("koobideh kebab skewers with saffron rice and tomato", "persian plate", "warm light", "persian setting", "4:3") },
        { slug: "zereshk-polo", name: { fa: "زرشک‌پلو", en: "Zereshk Polo" }, description: { fa: "با مرغ زعفرانی", en: "With saffron chicken" }, price: 475000, allowsCustomRequest: true, imagePrompt: prompt("zereshk polo with barberries and chicken", "persian plate", "warm light", "persian setting", "4:3") },
      ],
    },
    {
      slug: "pasta",
      name: { fa: "پاستا", en: "Pasta" },
      icon: "utensils",
      products: [
        { slug: "alfredo", name: { fa: "آلفردو", en: "Alfredo" }, description: { fa: "خامه‌ای با مرغ", en: "Creamy with chicken" }, price: 425000, allowsCustomRequest: true, imagePrompt: prompt("fettuccine alfredo with chicken", "bistro", "warm light", "casual table", "4:3") },
        { slug: "arrabbiata", name: { fa: "آرابیاتا", en: "Arrabbiata" }, description: { fa: "تند با ریحان", en: "Spicy with basil" }, price: 340000, badges: ["spicy"], allowsCustomRequest: true, imagePrompt: prompt("penne arrabbiata with chili and basil", "bistro", "warm light", "casual table", "4:3") },
      ],
    },
    {
      slug: "dessert",
      name: { fa: "دسر", en: "Dessert" },
      icon: "cake",
      products: [
        { slug: "cheesecake", name: { fa: "چیزکیک", en: "Cheesecake" }, description: { fa: "نیویورکی", en: "New York style" }, price: 195000, imagePrompt: prompt("new york cheesecake slice", "classic", "soft light", "casual plate", "4:3") },
        { slug: "tiramisu", name: { fa: "تیرامیسو", en: "Tiramisu" }, description: { fa: "کلاسیک", en: "Classic" }, price: 210000, imagePrompt: prompt("tiramisu with cocoa dust", "classic", "soft light", "casual plate", "4:3") },
      ],
    },
    {
      slug: "cold-drinks",
      name: { fa: "نوشیدنی سرد", en: "Cold Drinks" },
      icon: "cup-soda",
      products: [
        { slug: "lemonade", name: { fa: "لیموناد", en: "Lemonade" }, description: { fa: "تازه با نعناع", en: "Fresh with mint" }, price: 145000, imagePrompt: prompt("lemonade with mint and lemon", "refreshing", "bright light", "casual table", "1:1") },
        { slug: "mojito-mint-lime", name: { fa: "موخیتو نعناع و لیمو", en: "Mojito-style Mint Lime" }, description: { fa: "بدون الکل", en: "Zero-proof" }, price: 175000, imagePrompt: prompt("mojito-style mocktail with mint lime and crushed ice", "refreshing", "bright light", "casual bar", "1:1") },
        { slug: "iced-tea", name: { fa: "آیس‌تی", en: "Iced Tea" }, description: { fa: "چای سرد با لیمو", en: "Cold tea with lemon" }, price: 145000, imagePrompt: prompt("iced tea with lemon slices", "refreshing", "bright light", "casual table", "1:1") },
      ],
    },
  ],
};
