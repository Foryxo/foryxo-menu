import type { Locale } from "@/domains/i18n/config";

export interface BlogArticle {
  slug: string;
  category: Record<Locale, string>;
  title: Record<Locale, string>;
  excerpt: Record<Locale, string>;
  image: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  sections: Record<Locale, { heading: string; paragraphs: string[] }[]>;
}

const coreArticles: BlogArticle[] = [
  {
    slug: "digital-menu-that-people-can-actually-use",
    category: { fa: "تجربه مشتری", en: "Customer experience" },
    title: { fa: "منوی دیجیتال خوب فقط یک QR کد نیست", en: "A good digital menu is more than a QR code" },
    excerpt: { fa: "چطور یک منوی سریع، خوانا و قابل جستجو بسازیم که مشتری واقعاً از آن استفاده کند.", en: "How to build a fast, readable, searchable menu that guests can actually use." },
    image: "/images/demos/district/breakfast/omelette.webp",
    publishedAt: "2026-08-18",
    updatedAt: "2026-09-10",
    readingMinutes: 5,
    sections: {
      fa: [
        { heading: "سرعت، قبل از تزئین", paragraphs: ["مشتری معمولاً با اینترنت موبایل و در چند ثانیه اول تصمیم می‌گیرد. عنوان دسته‌ها، قیمت و وضعیت موجودی باید پیش از هر افکت تزئینی دیده شوند.", "عکس‌ها باید اندازه مشخص، فرمت بهینه و بارگذاری تدریجی داشته باشند تا صفحه هنگام باز شدن جابه‌جا نشود."] },
        { heading: "جستجو و دسته‌بندی واقعی", paragraphs: ["منوی طولانی بدون جستجو، فیلتر یا دسته‌بندی چسبان خیلی زود خسته‌کننده می‌شود. نام فارسی و انگلیسی، توضیح و دسته باید همگی قابل جستجو باشند."] },
        { heading: "یک منو برای همه", paragraphs: ["کنتراست کافی، متن قابل بزرگ‌نمایی، کنترل‌های ۴۴ پیکسلی و پشتیبانی درست از صفحه‌کلید تجربه را برای همه بهتر می‌کند، نه فقط کاربران دارای معلولیت."] },
      ],
      en: [
        { heading: "Speed before decoration", paragraphs: ["Guests often arrive on mobile data and decide within seconds. Categories, prices, and availability should appear before decorative effects.", "Images need reserved dimensions, efficient formats, and progressive loading so the page does not jump while it opens."] },
        { heading: "Real search and navigation", paragraphs: ["A long menu without search, filters, or sticky categories becomes tiring quickly. Persian and English names, descriptions, and categories should all be searchable."] },
        { heading: "A menu for everyone", paragraphs: ["Strong contrast, zoom-friendly type, 44-pixel controls, and reliable keyboard support improve the experience for every guest."] },
      ],
    },
  },
  {
    slug: "food-photography-for-online-menus",
    category: { fa: "عکاسی منو", en: "Menu photography" },
    title: { fa: "عکس غذا برای منوی آنلاین باید چه شکلی باشد؟", en: "What makes food photography work in an online menu?" },
    excerpt: { fa: "راهنمای کوتاه نور، کادر، هماهنگی و بهینه‌سازی عکس محصولات.", en: "A practical guide to lighting, framing, consistency, and image delivery." },
    image: "/images/demos/mora/dessert/basque-cheesecake.webp",
    publishedAt: "2026-08-28",
    updatedAt: "2026-09-10",
    readingMinutes: 4,
    sections: {
      fa: [
        { heading: "غذا باید قابل تشخیص باشد", paragraphs: ["عکس منو جای آزمایش‌های مبهم نیست. یک پرس کامل، بافت طبیعی و اندازه واقعی به مشتری کمک می‌کند چیزی را که سفارش می‌دهد بفهمد."] },
        { heading: "هماهنگی مهم‌تر از افکت", paragraphs: ["نور، زاویه دوربین و سطح پس‌زمینه را در هر گروه محصول ثابت نگه دارید. هماهنگی عکس‌ها باعث می‌شود کل منو حرفه‌ای‌تر دیده شود."] },
        { heading: "نسخه مناسب برای وب", paragraphs: ["فایل اصلی را نگه دارید، اما در صفحه از WebP یا AVIF و اندازه متناسب با محل نمایش استفاده کنید. تصویر بزرگ برای یک کارت کوچک فقط سرعت را کم می‌کند."] },
      ],
      en: [
        { heading: "The dish must be recognizable", paragraphs: ["Menu photography is not the place for vague experiments. A complete serving, natural texture, and believable scale help guests understand what they are ordering."] },
        { heading: "Consistency beats effects", paragraphs: ["Keep lighting, camera angle, and background surfaces consistent within each product family. A coherent set makes the whole menu feel more professional."] },
        { heading: "Deliver the right web version", paragraphs: ["Keep the source master, but serve WebP or AVIF at a size appropriate to the slot. Sending a huge source file into a tiny card only makes the menu slower."] },
      ],
    },
  },
  {
    slug: "bilingual-persian-english-menu",
    category: { fa: "منوی دوزبانه", en: "Bilingual menus" },
    title: { fa: "منوی فارسی و انگلیسی بدون به‌هم‌ریختگی", en: "A Persian–English menu without layout problems" },
    excerpt: { fa: "نکات مهم ترجمه، جهت صفحه، فونت و حفظ جای کاربر هنگام تغییر زبان.", en: "Translation, direction, typography, and preserving context when guests switch language." },
    image: "/images/demos/khesht/appetizers/kashk-bademjan.webp",
    publishedAt: "2026-09-04",
    updatedAt: "2026-09-10",
    readingMinutes: 6,
    sections: {
      fa: [
        { heading: "ترجمه با تغییر زبان فرق دارد", paragraphs: ["تنها جایگزین کردن چند کلمه کافی نیست. نام غذا، مواد اصلی، حساسیت‌زاها و توضیح روش پخت باید برای مخاطب مقصد قابل فهم باشند."] },
        { heading: "جهت باید از ریشه درست باشد", paragraphs: ["صفحه فارسی باید در سطح سند RTL و صفحه انگلیسی LTR باشد. این کار روی ترتیب خواندن، فونت، کنترل‌ها و ابزارهای کمکی اثر می‌گذارد."] },
        { heading: "کاربر را به خانه نفرستید", paragraphs: ["تغییر زبان باید همان محصول، دسته یا مقاله را باز نگه دارد و فقط زبان مسیر را عوض کند. پارامترها و بخش انتخاب‌شده نیز باید حفظ شوند."] },
      ],
      en: [
        { heading: "Translation is more than switching labels", paragraphs: ["Replacing a few words is not enough. Dish names, core ingredients, allergens, and preparation descriptions must make sense to the target audience."] },
        { heading: "Direction starts at the document root", paragraphs: ["Persian pages should be RTL and English pages LTR at the document level. This affects reading order, fonts, controls, and assistive technology."] },
        { heading: "Do not send guests home", paragraphs: ["Changing language should keep the same product, category, or article open. Query parameters and selected sections should remain intact too."] },
      ],
    },
  },
];

const guides = [
  ["qr-code-placement-in-restaurants", "عملیات", "Operations", "بهترین جای QR منو در کافه و رستوران", "Where to place menu QR codes in a café or restaurant", "از ورودی تا روی میز؛ جای درست QR باید پیدا باشد، نور را بازتاب ندهد و برای مهمان توضیح کوتاه داشته باشد.", "From the entrance to each table, a QR should be visible, glare-free, and paired with a short instruction.", "/images/generated/saffron-chicken-rice.webp"],
  ["table-qr-vs-main-menu-qr", "راهنمای QR", "QR guide", "QR اصلی یا QR اختصاصی هر میز؟", "Main-menu QR or one code per table?", "برای نمایش ساده منو یک کد کافی است؛ کد هر میز زمانی ارزش دارد که سفارش یا درخواست خدمات باید شماره میز را بداند.", "One code is enough for menu viewing; table codes matter when orders or service requests need table context.", "/images/demos/district/persian/joojeh-kebab.webp"],
  ["digital-menu-pricing-guide", "کسب‌وکار", "Business", "هزینه واقعی منوی دیجیتال از چه چیزهایی ساخته می‌شود؟", "What actually determines digital-menu pricing?", "طراحی، تعداد زبان‌ها، ورود محتوا، سفارش‌گیری و شیوه مدیریت، اجزای اصلی یک برآورد شفاف هستند.", "Design, languages, content entry, ordering, and management mode are the main parts of a transparent estimate.", "/images/demos/atria/mains/steak-potatoes.webp"],
  ["menu-translation-that-sells", "چندزبانه", "Multilingual", "ترجمه منو که فقط ترجمه کلمه‌به‌کلمه نیست", "Menu translation that goes beyond word-for-word", "نام مواد، روش پخت، حساسیت‌زاها و لحن برند باید برای مهمان خارجی روشن و طبیعی باشند.", "Ingredients, cooking methods, allergens, and brand tone should feel clear and natural to international guests.", "/images/generated/avocado-poached-eggs.webp"],
  ["restaurant-menu-accessibility", "دسترسی‌پذیری", "Accessibility", "منوی دیجیتال دسترس‌پذیر چه ویژگی‌هایی دارد؟", "What makes a digital menu accessible?", "کنتراست، اندازه لمس، ترتیب خواندن، متن جایگزین و حرکت قابل توقف، کیفیت منو را برای همه بالا می‌برند.", "Contrast, touch targets, reading order, alternative text, and controllable motion improve the menu for everyone.", "/images/demos/form/bowls/salmon-bowl.webp"],
  ["reduce-menu-load-time", "عملکرد", "Performance", "چطور منوی آنلاین را روی اینترنت ضعیف سریع نگه داریم", "How to keep an online menu fast on weak connections", "بودجه تصویر، کش، فونت و جاوااسکریپت تعیین می‌کند مهمان چند ثانیه برای دیدن قیمت‌ها منتظر بماند.", "Image budgets, caching, fonts, and JavaScript decide how long guests wait before prices appear.", "/images/demos/mora/espresso-bar/flat-white.webp"],
  ["menu-item-descriptions", "محتوا", "Content", "توضیح محصول کوتاه، دقیق و سفارش‌ساز", "Short, precise menu descriptions that help guests order", "توضیح خوب مواد کلیدی و حس غذا را روشن می‌کند، بدون اینکه کارت محصول را به یک پاراگراف طولانی تبدیل کند.", "A useful description clarifies key ingredients and character without turning a product card into a long paragraph.", "/images/demos/crush/burgers/classic-smash.webp"],
  ["allergen-labels-online-menu", "ایمنی مهمان", "Guest safety", "نمایش حساسیت‌زاها در منوی آنلاین", "Showing allergens in an online menu", "برچسب‌های روشن باید به اطلاعات معتبر آشپزخانه متصل باشند و جای هشدار پزشکی یا گفت‌وگو با کارکنان را نگیرند.", "Clear labels should reflect verified kitchen data and never replace medical guidance or a conversation with staff.", "/images/demos/miette/viennoiserie/almond-croissant.webp"],
  ["menu-search-and-filters", "تجربه مشتری", "Customer experience", "جستجو و فیلتر برای منوهای بلند", "Search and filters for long menus", "وقتی منو بزرگ می‌شود، جستجوی بدون غلط، دسته‌های چسبان و فیلترهای رژیمی مسیر تصمیم را کوتاه می‌کنند.", "As menus grow, forgiving search, sticky categories, and dietary filters shorten the path to a decision.", "/images/demos/district/burgers/smash-burger.webp"],
  ["seasonal-menu-scheduling", "عملیات", "Operations", "زمان‌بندی صبحانه، ناهار و آیتم‌های فصلی", "Scheduling breakfast, lunch, and seasonal items", "نمایش خودکار بخش درست منو، خطای سفارش و نیاز به ویرایش لحظه آخری را کمتر می‌کند.", "Automatically showing the right menu section reduces ordering mistakes and last-minute manual edits.", "/images/demos/sunday/brunch/eggs-benedict.webp"],
  ["menu-domain-options", "دامنه و انتشار", "Domains & launch", "دامنه اختصاصی یا آدرس فوریکسو؟", "Custom domain or a Foryxo menu address?", "هر دو مسیر می‌توانند حرفه‌ای باشند؛ انتخاب به مالکیت برند، بودجه و نیازهای فنی کسب‌وکار بستگی دارد.", "Both options can feel professional; the choice depends on brand ownership, budget, and technical needs.", "/images/demos/noir/mains/tenderloin.webp"],
  ["designing-menu-for-dark-restaurants", "طراحی", "Design", "طراحی منو برای فضاهای کم‌نور", "Designing menus for dimly lit venues", "حالت تیره به‌تنهایی کافی نیست؛ کنتراست متن، روشنایی عکس و بازتاب نمایشگر باید در محیط واقعی بررسی شوند.", "Dark mode alone is not enough; text contrast, photo brightness, and screen glare need testing in the real venue.", "/images/demos/noir/dessert/cremeux.webp"],
  ["food-photo-shot-list", "عکاسی منو", "Menu photography", "شات‌لیست عکاسی برای یک منوی کامل", "A practical photo shot list for a complete menu", "برنامه‌ریزی بر اساس دسته، زاویه و اندازه خروجی، روز عکاسی را سریع‌تر و مجموعه تصاویر را هماهنگ‌تر می‌کند.", "Planning by category, camera angle, and final crop makes shoot day faster and the image set more coherent.", "/images/generated/chocolate-ganache-cake.webp"],
  ["menu-analytics-without-creepy-tracking", "تحلیل", "Analytics", "تحلیل رفتار منو بدون ردیابی آزاردهنده", "Menu analytics without invasive tracking", "بازدید دسته، جستجو و کلیک آیتم برای تصمیم‌گیری کافی‌اند؛ داده شخصی اضافی هم ریسک می‌سازد و هم اعتماد را کم می‌کند.", "Category views, searches, and item taps are often enough; extra personal data creates risk and erodes trust.", "/images/demos/volt/cold/iced-matcha.webp"],
  ["menu-update-workflow", "مدیریت محتوا", "Content operations", "فرایند امن برای تغییر قیمت و موجودی", "A safe workflow for changing prices and availability", "پیش‌نمایش، ثبت تغییر، نقش‌های دسترسی و امکان بازگشت، جلوی انتشار قیمت اشتباه را می‌گیرند.", "Preview, audit history, access roles, and rollback prevent accidental price changes from reaching guests.", "/images/demos/khesht/persian-mains/zereshk-polo.webp"],
  ["mobile-first-menu-checklist", "طراحی موبایل", "Mobile design", "چک‌لیست منوی موبایل‌محور", "A mobile-first menu checklist", "خوانایی با یک دست، ناحیه امن، ورودی جستجو و پرش نکردن صفحه، مهم‌تر از کوچک کردن نسخه دسکتاپ هستند.", "One-handed readability, safe areas, search access, and layout stability matter more than shrinking a desktop page.", "/images/generated/pistachio-milkshake.webp"],
  ["launching-digital-menu", "راه‌اندازی", "Launch", "چک‌لیست روز انتشار منوی دیجیتال", "Digital-menu launch-day checklist", "قبل از چاپ QR، مسیر نهایی، زبان‌ها، قیمت‌ها، خطاها، آنالیتیکس و نسخه پشتیبان را روی چند گوشی واقعی بررسی کنید.", "Before printing QR codes, verify the final route, languages, prices, errors, analytics, and backup plan on real phones.", "/images/demos/atria/dessert/tiramisu.webp"],
] as const;

const moreArticles: BlogArticle[] = guides.map(([slug, categoryFa, categoryEn, titleFa, titleEn, excerptFa, excerptEn, image], index) => ({
  slug,
  category: { fa: categoryFa, en: categoryEn },
  title: { fa: titleFa, en: titleEn },
  excerpt: { fa: excerptFa, en: excerptEn },
  image,
  publishedAt: `2026-${String(6 + Math.floor(index / 6)).padStart(2, "0")}-${String(4 + (index * 3) % 24).padStart(2, "0")}`,
  updatedAt: "2026-09-12",
  readingMinutes: index % 3 === 0 ? 4 : 3,
  sections: {
    fa: [
      { heading: "تصمیم درست از مسئله واقعی شروع می‌شود", paragraphs: [`${excerptFa} قبل از انتخاب ابزار یا ظاهر، مسیر مهمان را از لحظه دیدن کد تا پیدا کردن و انتخاب محصول روی یک گوشی واقعی مرور کنید.`, "یک منوی خوب باید در چند ثانیه قابل فهم باشد. نام دسته، قیمت، وضعیت موجودی و اقدام اصلی نباید پشت انیمیشن، متن تبلیغاتی یا کنترل مبهم پنهان شوند."] },
      { heading: "اجرای قابل اندازه‌گیری", paragraphs: ["یک معیار روشن تعیین کنید: زمان باز شدن، تعداد لمس تا محصول، نرخ جستجوی بدون نتیجه یا تعداد درخواست‌های پشتیبانی. تغییر کوچک را منتشر کنید و اثر آن را بسنجید.", "نسخه فارسی و انگلیسی را جداگانه بررسی کنید. طول متن، جهت صفحه و شکستن خط‌ها یکسان نیست و هر زبان به کنترل کیفی مستقل نیاز دارد."] },
      { heading: "چک نهایی در محیط واقعی", paragraphs: ["پیش از انتشار، صفحه را با اینترنت موبایل، روشنایی کم، حالت تیره، بزرگ‌نمایی متن و یک دستگاه قدیمی‌تر امتحان کنید. سپس QR چاپی را از فاصله و زاویه واقعی اسکن کنید.", "در پایان مسئول به‌روزرسانی، زمان بازبینی و راه بازگشت به نسخه قبل را مشخص کنید. تجربه قابل اعتماد نتیجه نگهداری منظم است، نه فقط طراحی روز اول."] },
    ],
    en: [
      { heading: "Start with the real guest problem", paragraphs: [`${excerptEn} Before choosing a tool or visual treatment, walk through the guest journey from seeing the code to finding and choosing an item on a real phone.`, "A strong menu should make sense in seconds. Category names, prices, availability, and the primary action must not hide behind animation, marketing copy, or ambiguous controls."] },
      { heading: "Make the implementation measurable", paragraphs: ["Choose one clear measure: opening time, taps to a product, searches with no result, or support requests. Release a focused improvement and compare the result.", "Review Persian and English independently. Text length, page direction, and line wrapping differ, so each language needs its own quality check."] },
      { heading: "Test in the real environment", paragraphs: ["Before launch, try the page on mobile data, low brightness, dark mode, enlarged text, and an older device. Then scan the printed QR from realistic distances and angles.", "Finally, name the person responsible for updates, set a review rhythm, and keep a rollback path. A dependable experience comes from regular care, not only launch-day design."] },
    ],
  },
}));

export const blogArticles: BlogArticle[] = [...coreArticles, ...moreArticles];

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}
