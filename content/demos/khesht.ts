import { prompt, type DemoDefinition } from "./types";

export const khesht: DemoDefinition = {
  id: "khesht",
  name: "Khesht",
  nameFa: "خشت",
  tagline: {
    fa: "ایرانِ امروز، در قاب هندسه و خاک",
    en: "Contemporary Iran in geometry and clay",
  },
  bestFor: {
    fa: ["رستوران ایرانی", "رستوران سنتی مدرن", "سفره‌خانه"],
    en: ["Iranian restaurant", "Modern traditional", "Persian kitchen"],
  },
  characteristics: {
    fa: [
      "الهام از هندسه ایرانی و کاشی معرق — بدون تصاویر مذهبی",
      "پالت خاک/آجری با لهجه فیروزه‌ای",
      "تایپوگرافی فارسی اصیل",
      "کاشی‌کاری دیجیتال به‌عنوان جداکننده بخش‌ها",
    ],
    en: [
      "Persian geometry inspired — no religious imagery",
      "Clay/brick palette with turquoise accent",
      "Authentic Persian typography",
      "Digital tilework as section dividers",
    ],
  },
  supportedFeatures: ["search", "favorites", "table_qr", "call_waiter", "analytics_lite", "scheduled_menu"],
  colorMode: "light",
  theme: {
    bg: "#faf5ee",
    card: "#fffdf9",
    fg: "#3a2418",
    muted: "#8a6d58",
    line: "#eadbc8",
    accent: "#b4532a",
    accentFg: "#fff8f0",
    fontFeel: "classic",
    radius: "6px",
  },
  categories: [
    {
      slug: "kebabs",
      name: { fa: "کباب‌ها", en: "Kebabs" },
      icon: "flame",
      products: [
        { slug: "koobideh-2", name: { fa: "چلوکباب کوبیده دو سیخ", en: "Koobideh Kebab (2 skewers)" }, description: { fa: "دو سیخ کوبیده با برنج زعفرانی، گوجه کبابی و کره", en: "Two ground-meat skewers, saffron rice, grilled tomato, butter" }, price: 495000, badges: ["bestseller"], imagePrompt: prompt("two koobideh kebab skewers on saffron rice with grilled tomato and butter", "traditional Persian copper plate", "warm natural restaurant light", "Persian ceramic tableware, no religious symbols", "4:3") },
        { slug: "barg", name: { fa: "چلوکباب برگ", en: "Barg Kebab" }, description: { fa: "فیله گوشت با زعفران و برنج ایرانی", en: "Saffron fillet with Persian rice" }, price: 795000, imagePrompt: prompt("barg kebab fillet pieces over saffron rice with grilled tomato", "elegant plating on ceramic", "warm daylight", "Persian tableware", "4:3") },
        { slug: "joojeh-saffron", name: { fa: "چلو جوجه زعفرانی", en: "Saffron Chicken" }, description: { fa: "جوجه زعفرانی با استخوان یا بدون استخوان", en: "Saffron chicken, on or off bone" }, price: 520000, imagePrompt: prompt("saffron grilled chicken pieces with lemon and rice", "copper plate", "natural light", "Persian ceramic elements", "4:3") },
        { slug: "soltani", name: { fa: "کباب سلطانی", en: "Soltani Kebab" }, description: { fa: "یک سیخ برگ و یک سیخ کوبیده", en: "Barg and koobideh together" }, price: 980000, imagePrompt: prompt("soltani kebab platter with barg fillet and koobideh on rice", "grand plating", "warm restaurant light", "Persian ceramic and copper", "4:3") },
        { slug: "viziri", name: { fa: "کباب وزیری", en: "Viziri Kebab" }, description: { fa: "جوجه و کوبیده با ته‌دیگ", en: "Chicken and koobideh with tahdig" }, price: 695000, imagePrompt: prompt("viziri kebab with chicken and koobideh skewers over rice with tahdig piece", "platter", "warm light", "Persian ceramics", "4:3") },
      ],
    },
    {
      slug: "stews",
      name: { fa: "خورش‌ها", en: "Stews" },
      icon: "soup",
      products: [
        { slug: "ghormeh-sabzi", name: { fa: "قورمه‌سبزی", en: "Ghormeh Sabzi" }, description: { fa: "خورش سبزی، لوبیا و گوشت با لیمو عمانی", en: "Herb stew with beans, lamb, dried lime" }, price: 410000, badges: ["bestseller"], imagePrompt: prompt("ghormeh sabzi herb stew in traditional bowl with rice beside", "rustic ceramic bowl", "warm light", "Persian table setting", "4:3") },
        { slug: "gheymeh-bademjan", name: { fa: "قیمه بادمجان", en: "Gheymeh Bademjan" }, description: { fa: "خورش قیمه با بادمجان سرخ‌شده", en: "Yellow-split-pea stew with fried eggplant" }, price: 425000, imagePrompt: prompt("gheymeh bademjan stew with fried eggplant and golden split peas", "ceramic bowl", "warm natural light", "Persian tableware", "4:3") },
        { slug: "fesanjun", name: { fa: "فسنجان با مرغ", en: "Fesenjan with Chicken" }, description: { fa: "گردو و رب انار با مرغ", en: "Walnut and pomegranate with chicken" }, price: 490000, imagePrompt: prompt("fesenjan stew with chicken, dark walnut pomegranate sauce, pomegranate seeds garnish", "elegant ceramic", "soft warm light", "Persian setting", "4:3") },
      ],
    },
    {
      slug: "persian-mains",
      name: { fa: "غذاهای ایرانی", en: "Persian Mains" },
      icon: "utensils",
      products: [
        { slug: "baghali-polo", name: { fa: "باقالی‌پلو با ماهیچه", en: "Baghali Polo with Lamb Shank" }, description: { fa: "برنج با شوید و باقالی، ماهیچه آرام‌پز", en: "Dill and fava-bean rice, slow-cooked lamb shank" }, price: 1150000, badges: ["chef"], imagePrompt: prompt("baghali polo rice with dill and a braised lamb shank", "grand platter", "warm restaurant light", "Persian ceramics and copper", "4:3") },
        { slug: "zereshk-polo", name: { fa: "زرشک‌پلو با مرغ", en: "Zereshk Polo with Chicken" }, description: { fa: "برنج با زرشک و زعفران، ران مرغ", en: "Barberry saffron rice, chicken leg" }, price: 475000, imagePrompt: prompt("zereshk polo with barberries and saffron chicken leg", "ceramic plate", "natural light", "Persian tableware", "4:3") },
        { slug: "tahchin", name: { fa: "ته‌چین مرغ", en: "Chicken Tahchin" }, description: { fa: "برنج زعفرانی لایه‌ای با مرغ", en: "Saffron rice cake with chicken" }, price: 450000, imagePrompt: prompt("tahchin slice showing golden crispy rice layers with chicken", "cut slice on plate", "warm light", "Persian setting", "4:3") },
        { slug: "akbar-joojeh", name: { fa: "اکبرجوجه", en: "Akbar Joojeh" }, description: { fa: "جوجه بزرگ زعفرانی با لیمو", en: "Large saffron cornish hen with lemon" }, price: 520000, imagePrompt: prompt("akbar joojeh whole saffron roasted cornish hen with lemon and sumac", "platter", "warm restaurant light", "Persian ceramics", "4:3") },
      ],
    },
    {
      slug: "appetizers",
      name: { fa: "پیش‌غذا", en: "Appetizers" },
      icon: "salad",
      products: [
        { slug: "mirza-ghasemi", name: { fa: "میرزا قاسمی", en: "Mirza Ghasemi" }, description: { fa: "بادمجان، سیر و گوجه با تخم‌مرغ", en: "Eggplant, garlic, tomato, egg" }, price: 245000, imagePrompt: prompt("mirza ghasemi eggplant dip in clay bowl with bread pieces", "rustic plating", "warm light", "Persian table", "4:3") },
        { slug: "kashk-bademjan", name: { fa: "کشک بادمجان", en: "Kashk-e Bademjan" }, description: { fa: "بادمجان با کشک و نعناع داغ", en: "Eggplant with kashk and mint oil" }, price: 265000, imagePrompt: prompt("kashk bademjan eggplant dish garnished with mint and whey swirls", "ceramic bowl", "warm light", "Persian tableware", "4:3") },
        { slug: "mast-moosir", name: { fa: "ماست موسیر", en: "Shallot Yogurt" }, description: { fa: "ماست چکیده با موسیر", en: "Strained yogurt with wild shallot" }, price: 95000, imagePrompt: prompt("mast moosir thick yogurt in small clay bowl with shallot herbs", "minimal plating", "soft light", "Persian setting", "4:3") },
        { slug: "salad-shirazi", name: { fa: "سالاد شیرازی", en: "Shirazi Salad" }, description: { fa: "خیار، گوجه و پیاز با آب‌لیمو", en: "Cucumber, tomato, onion, lime" }, price: 110000, imagePrompt: prompt("shirazi salad finely diced cucumber tomato onion in glass bowl", "fresh and crisp", "bright light", "Persian table", "4:3") },
      ],
    },
    {
      slug: "drinks",
      name: { fa: "نوشیدنی", en: "Drinks" },
      icon: "cup-soda",
      products: [
        { slug: "doogh", name: { fa: "دوغ سنتی", en: "Traditional Doogh" }, description: { fa: "دوغ خانگی با نعناع", en: "House doogh with mint" }, price: 95000, imagePrompt: prompt("doogh yogurt drink in traditional glass with dried mint", "refreshing look", "natural light", "Persian table", "1:1") },
        { slug: "saffron-sherbet", name: { fa: "شربت زعفران", en: "Saffron Sherbet" }, description: { fa: "شربت زعفران با یخ", en: "Saffron syrup over ice" }, price: 145000, imagePrompt: prompt("saffron sherbet drink in glass with ice and saffron threads", "golden color", "bright light", "Persian setting", "1:1") },
        { slug: "sekanjabin", name: { fa: "شربت سکنجبین", en: "Sekanjabin" }, description: { fa: "سکنجبین با خیار رنده‌شده", en: "Mint vinegar syrup with cucumber" }, price: 145000, imagePrompt: prompt("sekanjabin mint sherbet with grated cucumber in glass", "refreshing", "bright natural light", "Persian setting", "1:1") },
      ],
    },
  ],
};
