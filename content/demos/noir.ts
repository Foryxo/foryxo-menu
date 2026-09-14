import { prompt, type DemoDefinition } from "./types";

export const noir: DemoDefinition = {
  id: "noir",
  name: "NOIR TABLE",
  nameFa: "نوار تیبل",
  tagline: {
    fa: "شام لوکس، سینمایی و مینیمال",
    en: "Cinematic, minimal luxury dining",
  },
  bestFor: {
    fa: ["رستوران لاکچری", "فاین‌دینینگ", "بار و شام رسمی"],
    en: ["Fine dining", "Luxury restaurant", "Elegant dinner"],
  },
  characteristics: {
    fa: [
      "مشکی/عاجی با اکسنت متالیک شامپاینی",
      "ارائه آیتم مثل دفتر تِستینگ — بدون شلوغی",
      "فضای منفی زیاد و حرکت آرام",
      "بدون گرادیان طلایی بی‌سلیقه",
    ],
    en: [
      "Black / ivory with champagne metallic accent",
      "Tasting-journal item presentation",
      "Generous negative space, slow motion",
      "No tacky gold gradients",
    ],
  },
  supportedFeatures: ["search", "favorites", "reservation_link", "analytics_lite"],
  colorMode: "dark",
  theme: {
    bg: "#0a0a0c",
    card: "#131318",
    fg: "#ece7dd",
    muted: "#8f8a80",
    line: "#23232b",
    accent: "#c8a96a",
    accentFg: "#0a0a0c",
    fontFeel: "classic",
    radius: "2px",
  },
  categories: [
    {
      slug: "starters",
      name: { fa: "پیش‌غذا", en: "Starters" },
      products: [
        { slug: "pumpkin-veloute", name: { fa: "ولوته کدو حلوایی", en: "Roasted Pumpkin Velouté" }, description: { fa: "با روغن تخم کدو و کرم ترش", en: "Pumpkin-seed oil, crème fraîche" }, price: 320000, imagePrompt: prompt("roasted pumpkin velouté soup in dark ceramic bowl with cream swirl and seed oil", "fine-dining plating", "dramatic side light", "dark negative space", "4:3") },
        { slug: "burrata", name: { fa: "بوراتا و گوجه", en: "Burrata & Tomato" }, description: { fa: "بوراتا، گوجه هیرلوم و ریحان", en: "Burrata, heirloom tomato, basil" }, price: 475000, imagePrompt: prompt("burrata with heirloom tomatoes and basil oil on dark plate", "michelin-style plating", "dramatic light", "black slate", "4:3") },
        { slug: "charred-prawn", name: { fa: "میگو ذغالی", en: "Charred Prawn" }, description: { fa: "میگو با کره سیر و لیمو", en: "Garlic butter, lemon" }, price: 595000, imagePrompt: prompt("charred prawns with garlic butter and lemon on dark ceramic", "fine dining", "moody light", "dark stone", "4:3") },
      ],
    },
    {
      slug: "mains",
      name: { fa: "غذای اصلی", en: "Main" },
      products: [
        { slug: "chicken-supreme", name: { fa: "سوپریم مرغ", en: "Herb Chicken Supreme" }, description: { fa: "با سس جوس و ریحان", en: "Jus, herb crust" }, price: 690000, imagePrompt: prompt("herb-crusted chicken supreme with jus on dark plate", "fine dining plating", "dramatic light", "black ceramic", "4:3") },
        { slug: "tenderloin", name: { fa: "فیله گوساله", en: "Beef Tenderloin" }, description: { fa: "با پوره سیب‌زمینی ترافل", en: "Truffle potato purée" }, price: 1350000, badges: ["chef"], imagePrompt: prompt("beef tenderloin medallions with truffle potato purée and jus", "michelin plating", "dramatic side light", "dark slate", "4:3") },
        { slug: "salmon", name: { fa: "سالمون", en: "Seared Salmon" }, description: { fa: "پوست ترد، سس هل", en: "Crispy skin, cardamom sauce" }, price: 1090000, imagePrompt: prompt("seared salmon fillet crispy skin up with cardamom beurre blanc", "fine dining", "moody light", "dark plate", "4:3") },
        { slug: "risotto", name: { fa: "ریزوتو قارچ", en: "Wild Mushroom Risotto" }, description: { fa: "قارچ کوهی و پارمزان", en: "Wild mushrooms, parmesan" }, price: 625000, imagePrompt: prompt("wild mushroom risotto with parmesan crisp on dark ceramic", "elegant plating", "dramatic light", "black slate", "4:3") },
      ],
    },
    {
      slug: "dessert",
      name: { fa: "دسر", en: "Dessert" },
      products: [
        { slug: "cremeux", name: { fa: "کرمو شکلات تلخ", en: "Dark Chocolate Crémeux" }, description: { fa: "با نمک دریا و طلا خوراکی", en: "Sea salt, edible gold leaf" }, price: 365000, imagePrompt: prompt("dark chocolate cremeux with sea salt and subtle gold leaf on black plate", "luxury plating", "dramatic light", "black ceramic", "4:3") },
        { slug: "paris-brest", name: { fa: "پاری-برست پسته", en: "Pistachio Paris-Brest" }, description: { fa: "کریم پسته و خمیر شو", en: "Pistachio cream, choux" }, price: 390000, imagePrompt: prompt("pistachio paris-brest with green cream rings", "pastry precision", "moody light", "dark plate", "4:3") },
        { slug: "citrus-tart", name: { fa: "تارت مرکبات", en: "Citrus Tart" }, description: { fa: "کریم مرکبات و مرنگ", en: "Citrus curd, meringue" }, price: 345000, imagePrompt: prompt("citrus tart with torched meringue peaks", "fine pastry", "moody light", "dark ceramic", "4:3") },
      ],
    },
    {
      slug: "mocktails",
      name: { fa: "نوشیدنی بار", en: "Mocktail Bar" },
      products: [
        { slug: "pomegranate-spritz", name: { fa: "اسپریتز انار", en: "Pomegranate Spritz" }, description: { fa: "انار، تونیک و رزماری", en: "Pomegranate, tonic, rosemary" }, price: 245000, imagePrompt: prompt("pomegranate spritz mocktail in wine glass with rosemary", "ruby red color", "backlit moody", "dark bar", "1:1") },
        { slug: "citrus-tonic", name: { fa: "تونیک مرکبات", en: "Citrus Tonic" }, description: { fa: "پرتقال، گریپ‌فروت و تونیک", en: "Orange, grapefruit, tonic" }, price: 220000, imagePrompt: prompt("citrus tonic with orange and grapefruit wheels", "layered look", "backlit", "dark bar counter", "1:1") },
        { slug: "saffron-pear-cooler", name: { fa: "کولر زعفران و گلابی", en: "Saffron Pear Cooler" }, description: { fa: "گلابی، زعفران و لیمو", en: "Pear, saffron, lemon" }, price: 275000, badges: ["new"], imagePrompt: prompt("saffron pear cooler with pear slice garnish", "golden hue", "backlit", "dark bar", "1:1") },
      ],
    },
  ],
};
