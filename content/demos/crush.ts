import { prompt, type DemoDefinition } from "./types";

export const crush: DemoDefinition = {
  id: "crush",
  name: "CRUSH",
  nameFa: "کراش",
  tagline: {
    fa: "فست‌فود پرانرژی، سفارش سریع",
    en: "High-energy fast food, fast ordering",
  },
  bestFor: {
    fa: ["فست‌فود", "برگر‌فروشی", "پیتزافروشی"],
    en: ["Fast food", "Burger joint", "Pizzeria"],
  },
  characteristics: {
    fa: [
      "بروتالیسم بازیگوش: قرمز گوجه‌ای، سفید و مشکی",
      "کراپ‌های بزرگ غذا و لیبل استیکری",
      "کنتراست بالا و انرژی بصری",
      "بهینه برای سفارش موبایلی سریع",
    ],
    en: [
      "Playful brutalist: tomato red, off-white, black",
      "Huge food crops, sticker-like labels",
      "High contrast, visual energy",
      "Optimized for fast mobile ordering",
    ],
  },
  supportedFeatures: ["search", "cart", "modifiers", "whatsapp_order", "telegram_order", "direct_order", "discounts", "pwa"],
  colorMode: "light",
  theme: {
    bg: "#fff7ed",
    card: "#ffffff",
    fg: "#171310",
    muted: "#6b5d52",
    line: "#f0e2d2",
    accent: "#dc2626",
    accentFg: "#ffffff",
    fontFeel: "bold",
    radius: "4px",
  },
  categories: [
    {
      slug: "burgers",
      name: { fa: "برگر", en: "Burgers" },
      icon: "beef",
      products: [
        {
          slug: "classic-smash", name: { fa: "کلاسیک اسمش", en: "Classic Smash" },
          description: { fa: "پتی گوشت اسمش‌شده، پنیر چدار، سس مخصوص", en: "Smashed beef patty, cheddar, house sauce" },
          price: 285000, badges: ["bestseller"],
          imagePrompt: prompt("a smash burger cross-section with melted cheddar dripping", "wrapper-wrapped bottom half", "bright commercial light", "red-brick wall background", "1:1"),
          modifiers: [
            {
              slug: "patty", name: { fa: "تعداد پتی", en: "Patty count" }, min: 1, max: 1, required: true,
              options: [
                { slug: "single", name: { fa: "تک", en: "Single" }, delta: 0, default: true },
                { slug: "double", name: { fa: "دوبل", en: "Double" }, delta: 95000 },
              ],
            },
            {
              slug: "extras", name: { fa: "اضافات", en: "Extras" }, min: 0, max: 4,
              options: [
                { slug: "cheese", name: { fa: "پنیر اضافه", en: "Extra cheese" }, delta: 35000 },
                { slug: "beef-strips", name: { fa: "خیارشور گوشت (بیف استریپس)", en: "Smoked beef strips" }, delta: 45000 },
                { slug: "jalapeno", name: { fa: "هالوپینو", en: "Jalapeño" }, delta: 25000 },
                { slug: "onion-jam", name: { fa: "پیاز کاراملی", en: "Caramelized onion" }, delta: 25000 },
              ],
            },
            {
              slug: "sauce", name: { fa: "سس", en: "Sauce" }, min: 0, max: 2,
              options: [
                { slug: "house", name: { fa: "سس مخصوص", en: "House sauce" }, delta: 0, default: true },
                { slug: "garlic", name: { fa: "سس سیر", en: "Garlic sauce" }, delta: 15000 },
                { slug: "bbq", name: { fa: "سس باربیکیو", en: "BBQ sauce" }, delta: 15000 },
              ],
            },
          ],
        },
        { slug: "double-smash", name: { fa: "دوبل اسمش", en: "Double Smash" }, description: { fa: "دو پتی اسمش، دبل پنیر", en: "Two smashed patties, double cheese" }, price: 365000, imagePrompt: prompt("a double smash burger with two patties and dripping cheese", "cross-section", "bright commercial light", "red-brick wall", "1:1") },
        { slug: "beef-bacon-burger", name: { fa: "برگر با بیف استریپس", en: "Beef-Strips Burger" }, description: { fa: "با بیف دودی (بدون خوک)", en: "Smoked beef strips (no pork)" }, price: 395000, imagePrompt: prompt("a burger with crispy smoked beef strips and melted cheese", "cross-section", "bright light", "red-brick background", "1:1") },
        { slug: "mushroom-swiss", name: { fa: "قارچ و پنیر سوئیسی", en: "Mushroom Swiss" }, description: { fa: "قارچ سوته و پنیر سوئیسی", en: "Sautéed mushrooms, Swiss cheese" }, price: 385000, imagePrompt: prompt("a mushroom swiss burger with sauteed mushrooms cascading", "cross-section", "bright commercial light", "brick wall", "1:1") },
        { slug: "crispy-chicken", name: { fa: "چیزکن ترد", en: "Crispy Chicken" }, description: { fa: "فیله مرغ سوخاری با سس سیر", en: "Crispy fillet, garlic mayo" }, price: 315000, badges: ["spicy"], imagePrompt: prompt("a crispy fried chicken burger with golden crust and pickles", "cross-section", "bright light", "red-brick background", "1:1") },
      ],
    },
    {
      slug: "pizza",
      name: { fa: "پیتزا", en: "Pizza" },
      icon: "pizza",
      products: [
        {
          slug: "beef-pepperoni", name: { fa: "پیتزا پپرونی گوشت", en: "Beef Pepperoni Pizza" },
          description: { fa: "پپرونی گوشت، پنیر کش‌دار", en: "Beef pepperoni, stretchy mozzarella" },
          price: 475000, badges: ["bestseller"],
          imagePrompt: prompt("a beef pepperoni pizza with curling pepperoni cups and melted cheese", "whole pizza on dark tray", "bright commercial light", "rustic wood surface", "1:1"),
          modifiers: [
            {
              slug: "size", name: { fa: "اندازه", en: "Size" }, min: 1, max: 1, required: true,
              options: [
                { slug: "medium", name: { fa: "متوسط ۳۰ سانت", en: "Medium 30cm" }, delta: 0, default: true },
                { slug: "large", name: { fa: "بزرگ ۳۵ سانت", en: "Large 35cm" }, delta: 120000 },
              ],
            },
            {
              slug: "crust", name: { fa: "خمیر", en: "Crust" }, min: 1, max: 1, required: true,
              options: [
                { slug: "classic", name: { fa: "کلاسیک", en: "Classic" }, delta: 0, default: true },
                { slug: "thin", name: { fa: "نازک", en: "Thin" }, delta: 0 },
                { slug: "cheesy-bite", name: { fa: "لبه پنیری", en: "Cheesy bite" }, delta: 85000 },
              ],
            },
            {
              slug: "extra", name: { fa: "اضافه", en: "Extras" }, min: 0, max: 3,
              options: [
                { slug: "extra-cheese", name: { fa: "پنیر اضافه", en: "Extra cheese" }, delta: 45000 },
                { slug: "mushroom", name: { fa: "قارچ", en: "Mushroom" }, delta: 35000 },
                { slug: "olive", name: { fa: "زیتون", en: "Olives" }, delta: 30000 },
              ],
            },
          ],
        },
        { slug: "margherita", name: { fa: "مارگاریتا", en: "Margherita" }, description: { fa: "سس گوجه، موزارلا و ریحان تازه", en: "Tomato, mozzarella, fresh basil" }, price: 390000, imagePrompt: prompt("a margherita pizza with fresh basil leaves and buffalo mozzarella", "wood-fired look", "bright light", "rustic wood", "1:1") },
        { slug: "chicken-alfredo-pizza", name: { fa: "پیتزا آلفردو مرغ", en: "Chicken Alfredo Pizza" }, description: { fa: "سس آلفردو، مرغ و قارچ", en: "Alfredo sauce, chicken, mushrooms" }, price: 510000, imagePrompt: prompt("a white alfredo chicken pizza with mushrooms", "slice lift with cheese pull", "bright light", "wood surface", "1:1") },
        { slug: "meat-lovers", name: { fa: "میلاورز", en: "Meat Lovers" }, description: { fa: "گوشت چرخ‌کرده، پپرونی و بیف دودی", en: "Ground beef, beef pepperoni, smoked beef" }, price: 550000, imagePrompt: prompt("a meat lovers pizza loaded with ground beef and pepperoni", "top-down", "bright commercial light", "rustic surface", "1:1") },
      ],
    },
    {
      slug: "sides",
      name: { fa: "پیش‌غذا و ساید", en: "Sides" },
      icon: "fries",
      products: [
        { slug: "fries", name: { fa: "سیب‌زمینی", en: "Fries" }, description: { fa: "ترد و طلایی", en: "Crispy golden" }, price: 165000, imagePrompt: prompt("golden fries in red paper carton", "appetizing", "bright light", "red table", "4:3") },
        { slug: "loaded-fries", name: { fa: "سیب‌زمینی ویژه", en: "Loaded Fries" }, description: { fa: "با پنیر، گوشت و سس", en: "Cheese, beef, sauce" }, price: 295000, badges: ["bestseller"], imagePrompt: prompt("loaded fries with melted cheese sauce and beef crumble", "close-up", "bright light", "red tray", "4:3") },
        { slug: "onion-rings", name: { fa: "حلقه پیاز", en: "Onion Rings" }, description: { fa: "سوخاری با سس مخصوص", en: "Crispy with house dip" }, price: 195000, imagePrompt: prompt("golden onion rings stacked with dip", "crunchy texture", "bright light", "red surface", "4:3") },
        { slug: "chicken-strips", name: { fa: "استریپس مرغ", en: "Chicken Strips" }, description: { fa: "۵ عدد با سس", en: "5 pieces with dip" }, price: 295000, imagePrompt: prompt("crispy chicken strips with dipping sauce", "golden crust", "bright light", "red tray", "4:3") },
      ],
    },
    {
      slug: "drinks",
      name: { fa: "نوشیدنی", en: "Drinks" },
      icon: "cup-soda",
      products: [
        { slug: "cola", name: { fa: "نوشابه", en: "Cola" }, description: { fa: "سرد و گازدار", en: "Cold and fizzy" }, price: 75000, imagePrompt: prompt("a cold cola can with condensation and ice", "no brand packaging, unbranded", "bright light", "red surface", "1:1") },
        { slug: "lemonade", name: { fa: "لیموناد", en: "Lemonade" }, description: { fa: "لیموی تازه و نعناع", en: "Fresh lemon, mint" }, price: 145000, imagePrompt: prompt("fresh lemonade with lemon slices and mint in glass", "condensation", "bright light", "casual table", "1:1") },
        { slug: "vanilla-shake", name: { fa: "شیک وانیلی", en: "Vanilla Shake" }, description: { fa: "بستنی وانیلی غلیظ", en: "Thick vanilla ice cream" }, price: 225000, imagePrompt: prompt("vanilla milkshake with whipped cream in tall glass", "classic look", "bright light", "diner-style table", "1:1") },
      ],
    },
  ],
};
