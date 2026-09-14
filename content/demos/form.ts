import { prompt, type DemoDefinition } from "./types";

export const form: DemoDefinition = {
  id: "form",
  name: "FORM",
  nameFa: "فرم",
  tagline: {
    fa: "غذای سالم، شفاف مثل لیبل تغذیه",
    en: "Healthy food, transparent as a nutrition label",
  },
  bestFor: {
    fa: ["فود سالم", "میال‌پرپ", "فیت‌فود"],
    en: ["Healthy eatery", "Meal prep", "Fitness food"],
  },
  characteristics: {
    fa: [
      "سفید/گرافیت/سبز — فوق تمیز",
      "چیپ‌های کالری/پروتئین/کربوهیدرات/چربی",
      "فیلتر گیاهی/وگان/بدون گلوتن",
      "عکس تاپ‌داون با مواد واضح",
    ],
    en: [
      "White / graphite / green — ultra clean",
      "Calories/protein/carbs/fat chips",
      "Vegetarian / vegan / gluten-aware filters",
      "Top-down shots with visible ingredients",
    ],
  },
  supportedFeatures: ["search", "favorites", "cart", "nutrition", "dietary_filters", "discounts"],
  colorMode: "light",
  theme: {
    bg: "#f7f9f7",
    card: "#ffffff",
    fg: "#1c2420",
    muted: "#5f6f66",
    line: "#e2e9e3",
    accent: "#2f9e5f",
    accentFg: "#ffffff",
    fontFeel: "modern",
    radius: "12px",
  },
  categories: [
    {
      slug: "bowls",
      name: { fa: "بول‌ها", en: "Protein Bowls" },
      icon: "salad",
      products: [
        { slug: "chicken-bowl", name: { fa: "بول مرغ گریل", en: "Grilled Chicken Bowl" }, description: { fa: "برنج قهوه‌ای، سبزیجات و سس لیمو", en: "Brown rice, veggies, lemon sauce" }, price: 425000, badges: ["bestseller", "high_protein"], nutrition: { kcal: 520, protein: 42, carbs: 48, fat: 14 }, imagePrompt: prompt("grilled chicken protein bowl with brown rice broccoli and avocado", "top-down meal-prep arrangement", "bright clean light", "white ceramic bowl", "1:1") },
        { slug: "steak-bowl", name: { fa: "بول استیک", en: "Steak Protein Bowl" }, description: { fa: "استیک، کینوا و بادمجان گریل", en: "Steak, quinoa, grilled eggplant" }, price: 625000, nutrition: { kcal: 640, protein: 45, carbs: 42, fat: 22 }, imagePrompt: prompt("steak protein bowl with quinoa roasted vegetables", "top-down", "bright light", "white bowl", "1:1") },
        { slug: "salmon-bowl", name: { fa: "بول سالمون", en: "Salmon Bowl" }, description: { fa: "سالمون، ادامامه و سس سسیم", en: "Salmon, edamame, sesame" }, price: 690000, badges: ["omega3"], nutrition: { kcal: 590, protein: 40, carbs: 38, fat: 24 }, imagePrompt: prompt("salmon poke-style bowl with edamame rice and sesame", "top-down vibrant", "bright light", "ceramic bowl", "1:1") },
        { slug: "falafel-bowl", name: { fa: "بول فلافل", en: "Falafel Bowl" }, description: { fa: "فلافل، حمص و سبزیجات", en: "Falafel, hummus, greens" }, price: 345000, badges: ["vegan"], dietary: ["vegetarian", "vegan"], nutrition: { kcal: 480, protein: 18, carbs: 55, fat: 18 }, imagePrompt: prompt("falafel bowl with hummus swirl greens and pickled vegetables", "top-down", "bright light", "white bowl", "1:1") },
      ],
    },
    {
      slug: "salads",
      name: { fa: "سالاد", en: "Salads" },
      icon: "salad",
      products: [
        { slug: "caesar-light", name: { fa: "سزار سبک مرغ", en: "Chicken Caesar Light" }, description: { fa: "سس یونانی سبک", en: "Light yogurt dressing" }, price: 365000, dietary: ["low_carb"], nutrition: { kcal: 320, protein: 34, carbs: 12, fat: 12 }, imagePrompt: prompt("light caesar salad with grilled chicken and yogurt dressing", "45-degree angle", "clean light", "white bowl", "4:3") },
        { slug: "yogurt-bowl", name: { fa: "بول ماست یونانی", en: "Greek Yogurt Bowl" }, description: { fa: "ماست پروتئینه و گرانولا", en: "High-protein yogurt, granola" }, price: 245000, badges: ["vegetarian"], dietary: ["vegetarian"], nutrition: { kcal: 290, protein: 22, carbs: 30, fat: 8 }, imagePrompt: prompt("greek yogurt bowl with granola berries and chia", "top-down", "bright light", "ceramic bowl", "1:1") },
      ],
    },
    {
      slug: "breakfast",
      name: { fa: "صبحانه پروتئینه", en: "Protein Breakfast" },
      icon: "egg",
      products: [
        { slug: "protein-pancakes", name: { fa: "پنکیک پروتئینه", en: "Protein Pancakes" }, description: { fa: "با پودر پروتئین و موز", en: "Protein powder, banana" }, price: 315000, nutrition: { kcal: 380, protein: 28, carbs: 40, fat: 9 }, imagePrompt: prompt("protein pancakes with banana slices and yogurt", "top-down", "bright light", "white plate", "4:3") },
      ],
    },
    {
      slug: "smoothies",
      name: { fa: "اسموتی", en: "Smoothies" },
      icon: "cup-soda",
      products: [
        { slug: "peanut-banana", name: { fa: "اسموتی کره بادام‌زمینی و موز", en: "Peanut Banana Smoothie" }, description: { fa: "پروتئین و کربوهیدرات تمیز", en: "Protein + clean carbs" }, price: 265000, nutrition: { kcal: 420, protein: 24, carbs: 45, fat: 14 }, imagePrompt: prompt("peanut butter banana smoothie in glass with oats", "creamy texture", "bright light", "clean background", "1:1") },
        { slug: "berry-protein", name: { fa: "اسموتی توت پروتئینه", en: "Berry Protein Smoothie" }, description: { fa: "توت مخلوط و پروتئین", en: "Mixed berries, protein" }, price: 285000, nutrition: { kcal: 320, protein: 25, carbs: 35, fat: 6 }, imagePrompt: prompt("berry protein smoothie with vibrant purple color", "fresh", "bright light", "clean background", "1:1") },
        { slug: "matcha-protein-latte", name: { fa: "ماچا پروتئین لاته", en: "Matcha Protein Latte" }, description: { fa: "ماچا با شیر و پروتئین", en: "Matcha, milk, protein" }, price: 245000, nutrition: { kcal: 210, protein: 18, carbs: 18, fat: 6 }, imagePrompt: prompt("matcha protein latte with green foam", "clean look", "bright light", "minimal background", "1:1") },
      ],
    },
  ],
};
