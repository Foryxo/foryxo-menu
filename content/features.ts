/**
 * Feature catalog — consumed by the builder, pricing calculator and demo metadata.
 * Prices reference price_catalog keys; null = included in base design.
 */
export interface FeatureDef {
  key: string;
  fa: string;
  en: string;
  faDesc: string;
  enDesc: string;
  /** price_catalog key, or null if included free with every design */
  priceKey: string | null;
  recommended?: boolean;
  requires?: string[]; // feature dependencies
}

export const features: FeatureDef[] = [
  { key: "search", fa: "جستجو", en: "Search", faDesc: "جستجوی سریع بین آیتم‌های منو", enDesc: "Fast search across menu items", priceKey: null, recommended: true },
  { key: "favorites", fa: "علاقه‌مندی‌ها", en: "Favorites", faDesc: "مهمان‌ها می‌توانند آیتم‌ها را ذخیره کنند (با حساب اختیاری)", enDesc: "Guests can save items (optional account)", priceKey: "addon.favorites" },
  { key: "consumer_profiles", fa: "پروفایل مشتری", en: "Customer profiles", faDesc: "حساب اختیاری برای سابقه سفارش و علاقه‌مندی", enDesc: "Optional accounts with order history", priceKey: "addon.favorites", requires: ["favorites"] },
  { key: "cart", fa: "سبد سفارش", en: "Cart", faDesc: "سبد و ارسال سفارش به کانال انتخابی", enDesc: "Cart and order handoff", priceKey: "addon.cart", recommended: true },
  { key: "whatsapp_order", fa: "سفارش واتساپ", en: "WhatsApp ordering", faDesc: "ارسال سفارش به واتساپ رستوران", enDesc: "Send order to restaurant WhatsApp", priceKey: "addon.whatsapp", requires: ["cart"] },
  { key: "telegram_order", fa: "سفارش تلگرام", en: "Telegram ordering", faDesc: "ارسال سفارش به ربات تلگرام", enDesc: "Send order via Telegram bot", priceKey: "addon.telegram", requires: ["cart"] },
  { key: "direct_order", fa: "سفارش مستقیم", en: "Direct ordering", faDesc: "سفارش داخل منو، اعلان فوری، پذیرش و آماده‌سازی در پنل شعبه", enDesc: "In-menu orders, instant alerts, acceptance and preparation in the branch dashboard", priceKey: "addon.ordering_full", requires: ["cart"] },
  { key: "table_qr", fa: "QR اختصاصی هر میز", en: "Per-table QR codes", faDesc: "برای انتقال خودکار شماره میز به سفارش یا فراخوان گارسون؛ QR اصلی منو رایگان است", enDesc: "Passes the table number into ordering or waiter calls; the main-menu QR is included", priceKey: "addon.table_qr", recommended: true },
  { key: "call_waiter", fa: "فراخوان گارسون", en: "Call waiter", faDesc: "صدا زدن گارسون و درخواست صورت‌حساب", enDesc: "Call staff and request the bill", priceKey: "addon.call_waiter" },
  { key: "discounts", fa: "تخفیف‌ها", en: "Discounts", faDesc: "سیستم تخفیف و کمبو", enDesc: "Discount and combo system", priceKey: "addon.discounts" },
  { key: "scheduled_menu", fa: "منوی زمان‌بندی‌شده", en: "Scheduled menu", faDesc: "نمایش خودکار صبحانه/ناهار/شام", enDesc: "Auto breakfast/lunch/dinner switching", priceKey: "addon.hours_automation" },
  { key: "loyalty_ready", fa: "آماده باشگاه مشتریان", en: "Loyalty-ready", faDesc: "زیرساخت اتصال به باشگاه مشتریان", enDesc: "Architecture ready for loyalty", priceKey: null },
  { key: "analytics_lite", fa: "آمار پایه", en: "Analytics Lite", faDesc: "بازدید منو، پرفروش‌ها و جستجوها", enDesc: "Menu views, top items, searches", priceKey: "addon.analytics_lite", recommended: true },
  { key: "analytics_pro", fa: "آمار پیشرفته", en: "Analytics Pro", faDesc: "قیف فروش، منبع QR و گزارش کامل", enDesc: "Conversion funnel, QR sources, full reports", priceKey: "addon.analytics_pro", requires: ["analytics_lite"] },
  { key: "pwa", fa: "PWA", faDesc: "نصب روی گوشی مثل اپلیکیشن", en: "PWA", enDesc: "Installable like an app", priceKey: "addon.pwa" },
  { key: "multiple_branches", fa: "چند شعبه", en: "Multiple branches", faDesc: "شعبه‌یاب با منوی مشترک، مستقل یا ترکیبی و سفارش جداگانه هر شعبه", enDesc: "Branch finder with shared, unique, or mixed menus and branch-routed orders", priceKey: "addon.branch" },
  { key: "custom_domain", fa: "دامنه اختصاصی", en: "Custom domain", faDesc: "اتصال دامنه اختصاصی با SSL", enDesc: "Custom domain with SSL", priceKey: "addon.domain_setup" },
  { key: "custom_design", fa: "طراحی اختصاصی", en: "Custom design", faDesc: "طراحی از صفر برای برند شما", enDesc: "Design from scratch for your brand", priceKey: "package.custom" },
  { key: "admin_lite", fa: "پنل مدیریت (لایت)", en: "Admin panel (Lite)", faDesc: "ویرایش آیتم، قیمت و موجودی", enDesc: "Edit items, prices, availability", priceKey: "addon.admin_lite" },
  { key: "managed_editing", fa: "مدیریت توسط فوریکسو", en: "Foryxo managed", faDesc: "تغییرات را ما انجام می‌دهیم", enDesc: "We make the changes for you", priceKey: null },
  { key: "nutrition", fa: "اطلاعات تغذیه‌ای", en: "Nutrition info", faDesc: "کالری و ماکرو برای هر آیتم", enDesc: "Calories and macros per item", priceKey: null },
  { key: "dietary_filters", fa: "فیلتر رژیمی", en: "Dietary filters", faDesc: "فیلتر گیاهی/وگان/بدون گلوتن", enDesc: "Vegetarian / vegan / gluten filters", priceKey: null },
  { key: "custom_request", fa: "شخصی‌سازی سفارش", en: "Custom requests", faDesc: "یادداشت سفارشی مشتری روی هر آیتم", enDesc: "Per-item customer notes", priceKey: null },
  { key: "reservation_link", fa: "لینک رزرو", en: "Reservation link", faDesc: "لینک رزرو میز در منو", enDesc: "Reservation link in menu", priceKey: null },
  { key: "modifiers", fa: "مودیفایر پیشرفته", en: "Advanced modifiers", faDesc: "گزینه‌های ساختاریافته (سایز، تاپینگ و…)", enDesc: "Structured options (size, toppings…)", priceKey: "addon.cart" },
  { key: "upsell", fa: "پیشنهاد تکمیلی", en: "Upsell", faDesc: "پیشنهاد هوشمند آیتم مکمل", enDesc: "Smart complementary suggestions", priceKey: "addon.discounts" },
  { key: "payment_gateway", fa: "درگاه پرداخت", en: "Payment gateway", faDesc: "پرداخت آنلاین سفارش‌ها", enDesc: "Online order payments", priceKey: "addon.payment_gateway", requires: ["direct_order"] },
];

export function featureByKey(key: string): FeatureDef | undefined {
  return features.find((f) => f.key === key);
}

/** Demo ids map to concrete feature keys referenced in demo files. */
export const validFeatureKeys = new Set(features.map((f) => f.key));
