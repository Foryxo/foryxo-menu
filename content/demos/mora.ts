import { prompt, type DemoDefinition } from "./types";

export const mora: DemoDefinition = {
  id: "mora",
  name: "Mora Coffee",
  nameFa: "موراکافی",
  tagline: {
    fa: "مینیمالیسم گرم برای کافه‌های اسپشیالتی",
    en: "Warm minimalism for specialty coffee",
  },
  bestFor: {
    fa: ["کافه اسپشیالتی", "رسترت قهوه", "کافه کوچک"],
    en: ["Specialty café", "Coffee roastery", "Small café"],
  },
  characteristics: {
    fa: [
      "تایپوگرافی ادیتوریال روی پس‌زمینه کرم",
      "بافت کاغذ محو و عکس‌های کلوزآپ قهوه",
      "اسلایدر دسته‌ها با سوایپر",
      "انیمیشن‌های محدود و آرام",
    ],
    en: [
      "Editorial typography on warm cream",
      "Faint paper texture, tight coffee crops",
      "Swiper category carousel",
      "Restrained, calm motion",
    ],
  },
  supportedFeatures: ["search", "favorites", "pwa", "analytics_lite"],
  colorMode: "light",
  theme: {
    bg: "#f6f1e8",
    card: "#fffdf8",
    fg: "#22201c",
    muted: "#7a7264",
    line: "#e7dfd2",
    accent: "#2b2620",
    accentFg: "#f6f1e8",
    fontFeel: "modern",
    radius: "14px",
  },
  categories: [
    {
      slug: "espresso-bar",
      name: { fa: "بار اسپرسو", en: "Espresso Bar" },
      icon: "coffee",
      products: [
        { slug: "espresso", name: { fa: "اسپرسو", en: "Espresso" }, description: { fa: "تیپ‌شناسی روز، شات کوتاه با کرمای متراکم", en: "Single-origin short shot with dense crema" }, price: 95000, imagePrompt: prompt("a double espresso in a small ceramic cup with rich tiger-striped crema", "centered cup on a dark walnut table", "soft window side-light", "warm specialty café interior, blurred background", "1:1") },
        { slug: "double-espresso", name: { fa: "دبل اسپرسو", en: "Double Espresso" }, description: { fa: "دو شات، بدنهٔ قوی و ماندگار", en: "Two shots, long finish" }, price: 125000, imagePrompt: prompt("a double espresso in a larger demitasse with dense crema", "on stoneware saucer", "natural café daylight", "walnut wood table", "1:1") },
        { slug: "americano", name: { fa: "آمریکانو", en: "Americano" }, description: { fa: "اسپرسو با آب داغ، روشن و صاف", en: "Espresso lengthened with hot water" }, price: 125000, imagePrompt: prompt("an americano in a clear glass showing layered coffee", "on a ceramic saucer", "soft window light", "cream café table with linen napkin", "1:1") },
        { slug: "cortado", name: { fa: "کورتادو", en: "Cortado" }, description: { fa: "نسبت مساوی اسپرسو و شیر بخارداده", en: "Equal parts espresso and steamed milk" }, price: 145000, imagePrompt: prompt("a cortado in a small glass with thin milk layer over espresso", "close 45-degree view", "warm natural light", "espresso bar counter", "1:1") },
        { slug: "cappuccino", name: { fa: "کاپوچینو", en: "Cappuccino" }, description: { fa: "فوم مخملی و پودر کاکائو", en: "Velvet foam, dusted cocoa" }, price: 165000, badges: ["bestseller"], imagePrompt: prompt("a cappuccino with thick microfoam and light cocoa dusting", "classic tulip cup", "morning side light", "marble café counter", "1:1") },
        { slug: "flat-white", name: { fa: "فلت وایت", en: "Flat White" }, description: { fa: "دو شات با شیر ابریشمی و لاته‌آرت قشوی", en: "Double shot, silky milk, rosetta" }, price: 175000, imagePrompt: prompt("a flat white with fine rosetta latte art in a matte ceramic cup", "top-down slight angle", "soft diffused daylight", "light oak table", "1:1") },
        { slug: "cafe-latte", name: { fa: "کافه لاته", en: "Café Latte" }, description: { fa: "شیر بیشتر، بدنهٔ نرم و کرمی", en: "Milk-forward, creamy body" }, price: 175000, imagePrompt: prompt("a café latte with heart latte art in a tall ceramic cup", "side view on saucer", "gentle window light", "café interior with plants", "1:1") },
        { slug: "spanish-latte", name: { fa: "لاته اسپانیایی", en: "Spanish Latte" }, description: { fa: "با شیر عسلی و تلخی کنترل‌شده", en: "Condensed-milk sweetness, balanced" }, price: 195000, imagePrompt: prompt("a spanish latte in a clear glass with distinct condensed milk layer", "45-degree angle", "warm afternoon light", "dark table, blurred café", "1:1") },
      ],
    },
    {
      slug: "filter",
      name: { fa: "دم‌آوری", en: "Filter" },
      icon: "droplets",
      products: [
        { slug: "v60", name: { fa: "وی‌شصت", en: "V60" }, description: { fa: "دم‌آوری دستی، فنجان روشن و میوه‌ای", en: "Hand brew, bright and fruity" }, price: 210000, badges: ["chef"], imagePrompt: prompt("a V60 pour-over brewing with visible bloom, carafe beside", "overhead 30-degree view", "bright natural light", "brew bar with kettle", "4:3") },
        { slug: "chemex", name: { fa: "کمکس", en: "Chemex" }, description: { fa: "بدنهٔ تمیز برای دو نفر", en: "Clean cup, serves two" }, price: 240000, imagePrompt: prompt("a chemex brewer with brewed coffee and glass cup beside", "eye-level editorial shot", "soft daylight", "wooden brew bar", "4:3") },
        { slug: "aeropress", name: { fa: "ایروپرس", en: "Aeropress" }, description: { fa: "شات فیلتری متراکم", en: "Dense filter shot" }, price: 215000, imagePrompt: prompt("an aeropress brewing on a scale with fresh coffee dripping", "close-up", "natural light", "minimal brew station", "4:3") },
        { slug: "cold-brew", name: { fa: "کلد برو", en: "Cold Brew" }, description: { fa: "۱۸ ساعت عصاره‌گیری سرد", en: "18-hour cold extraction" }, price: 190000, imagePrompt: prompt("cold brew coffee with ice in a tall glass, deep amber color", "side view with condensation", "bright airy light", "light café table", "1:1") },
      ],
    },
    {
      slug: "dessert",
      name: { fa: "دسر", en: "Dessert" },
      icon: "cake",
      products: [
        { slug: "basque-cheesecake", name: { fa: "چیزکیک باسک", en: "Basque Cheesecake" }, description: { fa: "مرکز کرمی، سطح کاراملی", en: "Creamy center, caramelized top" }, price: 195000, badges: ["bestseller"], imagePrompt: prompt("a slice of basque burnt cheesecake with creamy center", "on muted stoneware plate", "soft café light", "linen and ceramic setting", "4:3") },
        { slug: "carrot-cake", name: { fa: "کیک هویج", en: "Carrot Cake" }, description: { fa: "فراستینگ پنیر خامه‌ای و گردو", en: "Cream-cheese frosting, walnuts" }, price: 175000, imagePrompt: prompt("a slice of carrot cake with visible walnut pieces and cream cheese frosting", "stone plate, realistic crumbs", "natural light", "warm café table", "4:3") },
        { slug: "tiramisu", name: { fa: "تیرامیسو", en: "Tiramisu" }, description: { fa: "ماسکارپونه و قهوهٔ اسپرسو", en: "Mascarpone and espresso layers" }, price: 210000, imagePrompt: prompt("a tiramisu slice with distinct espresso-soaked layers and cocoa dust", "stoneware plate", "soft daylight", "muted ceramic setting", "4:3") },
        { slug: "chocolate-cookie", name: { fa: "کوکی شکلاتی", en: "Chocolate Cookie" }, description: { fa: "بیرون ترد، داخل مذاب", en: "Crisp edge, molten center" }, price: 95000, imagePrompt: prompt("a dark chocolate cookie broken open with molten chocolate center", "on parchment paper", "warm light", "rustic café table", "4:3") },
      ],
    },
  ],
};
