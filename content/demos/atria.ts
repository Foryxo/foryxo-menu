import { prompt, type DemoDefinition } from "./types";

export const atria: DemoDefinition = {
  id: "atria",
  name: "Atria",
  nameFa: "آتریا",
  tagline: {
    fa: "کافه‌رستوران تمام‌وقت، ظریف و آرام",
    en: "All-day café restaurant, elegant and calm",
  },
  bestFor: {
    fa: ["کافه‌رستوران", "بامنه", "فضای All-day"],
    en: ["Café-restaurant", "All-day dining", "Bistro"],
  },
  characteristics: {
    fa: [
      "پالت زیتونی/کرم/زغالی",
      "بخش‌ها بر اساس زمان روز (صبحانه/ناهار/عصر)",
      "عکس لایف‌استایل پریمیوم",
      "چیدمان دوستونی دسکتاپ، تک‌ستون موبایل",
    ],
    en: [
      "Olive / cream / charcoal palette",
      "Sections shift by time of day",
      "Premium lifestyle photography",
      "Two-column desktop, single-column mobile",
    ],
  },
  supportedFeatures: ["search", "favorites", "cart", "table_qr", "scheduled_menu", "analytics_lite"],
  colorMode: "light",
  theme: {
    bg: "#f4f2ec",
    card: "#fcfbf7",
    fg: "#2c2c26",
    muted: "#77776b",
    line: "#e2ded2",
    accent: "#6b7c4a",
    accentFg: "#f8f7f2",
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
        { slug: "omelette", name: { fa: "املت کلاسیک", en: "Classic Omelette" }, description: { fa: "سه تخم‌مرغ با سس چمن و نان تست", en: "Three eggs, chives, sourdough toast" }, price: 245000, imagePrompt: prompt("a folded classic omelette with chives on ceramic plate", "clean plating", "warm morning daylight", "linen and light wood", "4:3") },
        { slug: "avocado-toast", name: { fa: "توست آواکادو و تخم‌مرغ", en: "Avocado Egg Toast" }, description: { fa: "نان خمیرترش، آواکادو و تخم‌مرغ نیمرو", en: "Sourdough, avocado, soft egg" }, price: 325000, badges: ["bestseller"], imagePrompt: prompt("avocado toast with poached egg and chili flakes on sourdough", "editorial plating", "morning light", "light marble", "4:3") },
        { slug: "english-breakfast", name: { fa: "صبحانه انگلیسی", en: "English-Style Breakfast" }, description: { fa: "تخم‌مرغ، لوبیا، قارچ و بیف دودی", en: "Eggs, beans, mushrooms, smoked beef" }, price: 395000, imagePrompt: prompt("full english-style breakfast plate with eggs beans mushrooms and smoked beef strips", "complete plating", "daylight", "bistro table", "4:3") },
        { slug: "pancakes", name: { fa: "پنکیک استک", en: "Pancake Stack" }, description: { fa: "سه لایه با شیرهٔ افرا و کره", en: "Three layers, maple, butter" }, price: 295000, imagePrompt: prompt("a stack of three fluffy pancakes with maple syrup pour and butter", "warm plating", "morning light", "ceramic plate", "4:3") },
      ],
    },
    {
      slug: "salads",
      name: { fa: "سالاد", en: "Salads" },
      icon: "salad",
      products: [
        { slug: "caesar-chicken", name: { fa: "سزار مرغ", en: "Caesar Chicken" }, description: { fa: "کاهو رومی، مرغ گریل، پارمزان", en: "Romaine, grilled chicken, parmesan" }, price: 345000, imagePrompt: prompt("caesar salad with grilled chicken strips and shaved parmesan", "bowl plating", "natural light", "marble table", "4:3") },
        { slug: "steak-salad", name: { fa: "سالاد استیک", en: "Grilled Steak Salad" }, description: { fa: "استیک ورقه‌شده و سس بلسامیک", en: "Sliced steak, balsamic" }, price: 495000, badges: ["chef"], imagePrompt: prompt("sliced grilled steak salad with balsamic glaze and greens", "elegant bowl", "natural light", "olive-toned table", "4:3") },
        { slug: "mediterranean-salad", name: { fa: "سالاد مدیترانه‌ای", en: "Mediterranean Salad" }, description: { fa: "فِتا، زیتون و خیار", en: "Feta, olives, cucumber" }, price: 295000, imagePrompt: prompt("mediterranean salad with feta olives cucumber and herbs", "bowl", "daylight", "bistro table", "4:3") },
      ],
    },
    {
      slug: "pasta",
      name: { fa: "پاستا", en: "Pasta" },
      icon: "utensils",
      products: [
        { slug: "alfredo", name: { fa: "آلفردو مرغ", en: "Alfredo Chicken" }, description: { fa: "سس خامه‌ای و پنیر پارمزان", en: "Creamy parmesan sauce" }, price: 425000, badges: ["bestseller"], imagePrompt: prompt("fettuccine alfredo with grilled chicken and parmesan", "twirl presentation", "warm light", "bistro table", "4:3") },
        { slug: "arrabbiata", name: { fa: "آرابیاتا", en: "Arrabbiata" }, description: { fa: "سس تند گوجه با ریحان", en: "Spicy tomato, basil" }, price: 340000, badges: ["spicy"], imagePrompt: prompt("penne arrabbiata with spicy tomato sauce and basil", "bowl", "warm light", "olive-toned table", "4:3") },
        { slug: "bolognese", name: { fa: "بولونیز", en: "Beef Bolognese" }, description: { fa: "خوراک گوشت آرام‌پز", en: "Slow-cooked ragù" }, price: 465000, imagePrompt: prompt("spaghetti bolognese with rich slow-cooked ragù and parmesan", "fork twirl", "warm light", "bistro table", "4:3") },
      ],
    },
    {
      slug: "mains",
      name: { fa: "غذای اصلی", en: "Mains" },
      icon: "beef",
      products: [
        { slug: "grilled-chicken", name: { fa: "مرغ گریل", en: "Grilled Chicken" }, description: { fa: "با سبزیجات گریل و سس لیمو", en: "Grilled vegetables, lemon sauce" }, price: 495000, imagePrompt: prompt("grilled chicken breast with charred vegetables and lemon sauce", "clean plating", "natural light", "ceramic plate", "4:3") },
        { slug: "steak-potatoes", name: { fa: "استیک و سیب‌زمینی", en: "Steak & Potatoes" }, description: { fa: "استیک ۲۵۰ گرمی و سیب‌زمینی گریل", en: "250g steak, grilled potatoes" }, price: 895000, badges: ["chef"], imagePrompt: prompt("grilled steak sliced with grilled potatoes and herb butter", "plated", "warm light", "charcoal-toned table", "4:3") },
        { slug: "schnitzel", name: { fa: "شنیتسل مرغ", en: "Chicken Schnitzel" }, description: { fa: "سوخاری با لیمو و سالاد", en: "Breaded, lemon, side salad" }, price: 485000, imagePrompt: prompt("golden chicken schnitzel with lemon wedge and salad", "plated", "natural light", "bistro table", "4:3") },
      ],
    },
    {
      slug: "cafe",
      name: { fa: "کافه", en: "Café" },
      icon: "coffee",
      daypart: { start: "12:00", end: "23:00" },
      products: [
        { slug: "americano", name: { fa: "آمریکانو", en: "Americano" }, description: { fa: "دوبل شات، صاف", en: "Double shot, black" }, price: 120000, imagePrompt: prompt("americano in white ceramic cup", "simple clean", "afternoon light", "olive-toned café table", "1:1") },
        { slug: "latte", name: { fa: "لاته", en: "Latte" }, description: { fa: "ابریشمی و متعادل", en: "Silky and balanced" }, price: 175000, imagePrompt: prompt("latte with rosetta art in ceramic cup", "elegant", "afternoon light", "café table", "1:1") },
        { slug: "matcha", name: { fa: "ماچا", en: "Matcha" }, description: { fa: "ماچا خالص یا با شیر", en: "Pure or with milk" }, price: 220000, imagePrompt: prompt("matcha latte with green foam in ceramic cup", "vibrant", "afternoon light", "bistro table", "1:1") },
      ],
    },
    {
      slug: "dessert",
      name: { fa: "دسر", en: "Dessert" },
      icon: "cake",
      products: [
        { slug: "tiramisu", name: { fa: "تیرامیسو", en: "Tiramisu" }, description: { fa: "کلاسیک با ماسکارپونه", en: "Classic mascarpone" }, price: 210000, imagePrompt: prompt("classic tiramisu slice with cocoa dust", "elegant plating", "afternoon light", "ceramic plate", "4:3") },
        { slug: "chocolate-fondant", name: { fa: "فوندان شکلاتی", en: "Chocolate Fondant" }, description: { fa: "مرکز مذاب با بستنی وانیلی", en: "Molten center, vanilla ice cream" }, price: 245000, badges: ["bestseller"], imagePrompt: prompt("chocolate fondant with flowing molten center and ice cream quenelle", "dramatic plating", "warm light", "charcoal plate", "4:3") },
      ],
    },
  ],
};
