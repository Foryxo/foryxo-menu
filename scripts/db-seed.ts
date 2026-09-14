/**
 * Database seed (spec §75). DEV/STAGING ONLY — never runs automatically in production.
 * Seeds: price catalog (§35), message templates (§36), 10 demo menus (§10–20),
 * demo theme rows. Dev users are created only when AUTH_DEV_OTP/dev env.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { env, isProd } from "../src/config/env";

async function main() {
  if (isProd && !process.env.FORCE_SEED) {
    throw new Error("Refusing to seed production without FORCE_SEED=1");
  }

  const { getDb } = await import("../src/domains/db/client");
  const db = getDb();
  const schema = await import("../src/domains/db/schema/index");

  console.log("→ seeding price catalog…");
  const { CATALOG } = await import("../src/domains/pricing/calculator");
  const LABELS: Record<string, [string, string, string]> = {
    // key: [category, customerLabelFa, customerLabelEn]
    "package.basic": ["package", "پکیج پایه (استاتیک)", "Basic package (static)"],
    "package.plus": ["package", "پکیج پلاس (دوزبانه)", "Plus package (bilingual)"],
    "package.pro": ["package", "پکیج پرو (مدیریتی)", "Pro package (managed)"],
    "package.business": ["package", "پکیج بیزینس (سفارش‌گیری)", "Business package (ordering)"],
    "package.custom": ["package", "طراحی اختصاصی", "Custom design"],
    "addon.english": ["language", "نسخه انگلیسی", "English version"],
    "addon.language": ["language", "زبان تکمیلی", "Additional language"],
    "addon.admin_lite": ["addon", "پنل مدیریت لایت", "Admin panel Lite"],
    "addon.admin_full": ["addon", "پنل مدیریت کامل", "Admin panel Full"],
    "addon.search": ["addon", "جستجو", "Search"],
    "addon.favorites": ["addon", "علاقه‌مندی‌ها", "Favorites"],
    "addon.cart": ["addon", "سبد سفارش", "Cart"],
    "addon.whatsapp": ["addon", "سفارش واتساپ", "WhatsApp ordering"],
    "addon.telegram": ["addon", "سفارش تلگرام", "Telegram ordering"],
    "addon.ordering_full": ["ordering", "سفارش‌گیری کامل", "Full ordering"],
    "addon.payment_gateway": ["ordering", "اتصال درگاه پرداخت", "Payment gateway setup"],
    "addon.table_qr": ["addon", "QR دائمی هر میز", "Permanent QR per table"],
    "addon.call_waiter": ["addon", "فراخوان گارسون", "Call waiter"],
    "addon.branch": ["addon", "شعبه اضافه", "Additional branch"],
    "addon.branch_unique_menu": ["addon", "منوی اختصاصی شعبه", "Unique branch menu"],
    "addon.discounts": ["addon", "سیستم تخفیف", "Discount system"],
    "addon.hours_automation": ["addon", "اتوماسیون ساعت کاری", "Opening-hours automation"],
    "addon.pwa": ["addon", "PWA", "PWA"],
    "addon.analytics_lite": ["addon", "آمار پایه", "Analytics Lite"],
    "addon.analytics_pro": ["addon", "آمار پیشرفته", "Analytics Pro"],
    "addon.domain_setup": ["domain", "اتصال دامنه", "Custom-domain setup"],
    "content.entry_50": ["content", "ورود اطلاعات تا ۵۰ آیتم", "Data entry up to 50 items"],
    "content.entry_extra_50": ["content", "هر ۵۰ آیتم اضافه", "Each extra 50 items"],
    "content.image_cleanup": ["content", "پردازش عکس (هر عکس)", "Image cleanup (per image)"],
    "hosting.basic": ["hosting", "هاستینگ پایه (سالانه)", "Basic hosting (annual)"],
    "hosting.support": ["hosting", "هاستینگ + پشتیبانی (سالانه)", "Hosting + support (annual)"],
    "hosting.managed": ["hosting", "به‌روزرسانی مدیریتی (سالانه)", "Managed updates (annual)"],
    "support.urgent": ["urgent", "پشتیبانی فوری", "Urgent support"],
  };
  for (const p of CATALOG) {
    const label = LABELS[p.key] ?? ["custom", p.key, p.key];
    const existing = (await db.select().from(schema.priceCatalog).where(eq(schema.priceCatalog.key, p.key)).limit(1))[0];
    if (existing) continue;
    await db.insert(schema.priceCatalog).values({
      id: randomUUID(),
      key: p.key,
      category: label[0],
      internalLabel: p.key,
      customerLabelFa: label[1],
      customerLabelEn: label[2],
      minPrice: p.min ?? null,
      defaultPrice: p.default,
      unit: p.unit ?? "fixed",
      maxPrice: p.max ?? null,
      isRecurring: Boolean(p.recurring),
      recurringPeriod: p.recurring ? "annual" : null,
    });
  }

  console.log("→ seeding message templates…");
  const T = (key: string, scenario: string, faSub: string, faBody: string, enSub: string, enBody: string) =>
    ({ key, scenario, faSub, faBody, enSub, enBody });
  const templates = [
    T("inquiry_reply", "Initial inquiry reply", "پاسخ به استعلام اولیه", "سلام {{customer_name}}،\nاز تماس شما سپاسگزاریم. تیم فوریکسو منو درخواست شما را بررسی می‌کند و حداکثر تا یک روز کاری پاسخ می‌دهد.", "Initial inquiry reply", "Hi {{customer_name}},\nThanks for reaching out. The Foryxo Menu team will review your inquiry and reply within one business day."),
    T("ask_existing_menu", "Ask for existing menu", "درخواست منوی فعلی", "سلام {{customer_name}}،\nبرای شروع، لطفاً آخرین نسخه منوی فعلی (عکس، PDF یا فایل) را برای ما بفرستید.", "Ask for existing menu", "Hi {{customer_name}},\nTo get started, please send your current menu (photo, PDF or file)."),
    T("ask_assets", "Ask for logo/assets", "درخواست لوگو و عکس‌ها", "سلام {{customer_name}}،\nلطفاً لوگو و چند عکس باکیفیت از غذاها را از پنل کاربری بارگذاری کنید.", "Ask for logo/assets", "Hi {{customer_name}},\nPlease upload your logo and a few quality dish photos from your dashboard."),
    T("choose_demo", "Ask customer to choose demo", "انتخاب طرح", "سلام {{customer_name}}،\nاز گالری دموها طرح موردعلاقه‌تان را انتخاب کنید تا شروع کنیم.", "Ask customer to choose demo", "Hi {{customer_name}},\nPick your favorite design from the demo gallery and we'll get started."),
    T("quote_sent", "Quote sent", "استعلام هزینه", "سلام {{customer_name}}،\nاستعلام هزینه «{{request_title}}» به مبلغ {{price}} {{currency}} در پنل شما ثبت شد. تا پیش از تأیید شما هیچ مبلغی کسر نمی‌شود.", "Quote sent", "Hi {{customer_name}},\nThe quote for \"{{request_title}}\" ({{price}} {{currency}}) is in your dashboard. Nothing is charged until you approve."),
    T("quote_approved", "Quote approved", "استعلام تأیید شد", "سلام {{customer_name}}،\nتأیید شما ثبت شد و کار روی «{{request_title}}» آغاز می‌شود.", "Quote approved", "Hi {{customer_name}},\nYour approval is recorded and work on \"{{request_title}}\" begins now."),
    T("payment_reminder", "Payment reminder", "یادآوری پرداخت", "سلام {{customer_name}}،\nفاکتور {{invoice_number}} هنوز پرداخت نشده است. در صورت پرداخت، پروژه سریع‌تر پیش می‌رود.", "Payment reminder", "Hi {{customer_name}},\nInvoice {{invoice_number}} is still unpaid. Settling it keeps your project moving."),
    T("payment_received", "Payment received", "پرداخت دریافت شد", "سلام {{customer_name}}،\nپرداخت فاکتور {{invoice_number}} به مبلغ {{price}} {{currency}} تأیید شد.", "Payment received", "Hi {{customer_name}},\nPayment for invoice {{invoice_number}} ({{price}} {{currency}}) is confirmed."),
    T("content_received", "Content received", "محتوا دریافت شد", "سلام {{customer_name}}،\nمحتوای منوی شما دریافت شد و در صف ورود اطلاعات قرار گرفت.", "Content received", "Hi {{customer_name}},\nYour menu content is received and queued for data entry."),
    T("missing_content", "Missing content", "کمبود محتوا", "سلام {{customer_name}}،\nبرای چند آیتم، قیمت یا توضیح کم است. لطفاً از پنل تکمیل کنید.", "Missing content", "Hi {{customer_name}},\nSome items are missing prices or descriptions. Please complete them in your dashboard."),
    T("first_preview", "First preview ready", "پیش‌نمایش اول آماده است", "سلام {{customer_name}}،\nپیش‌نمایش اول منوی شما آماده است؛ از پنل مشاهده و بازخورد بدهید.", "First preview ready", "Hi {{customer_name}},\nThe first preview of your menu is ready — review it from your dashboard."),
    T("revision_received", "Revision received", "اصلاحات دریافت شد", "سلام {{customer_name}}،\nدرخواست اصلاحات شما ثبت شد و در حال بررسی است.", "Revision received", "Hi {{customer_name}},\nYour revision request is recorded and under review."),
    T("revision_fee", "Revision requires fee", "اصلاحات نیازمند هزینه", "سلام {{customer_name}}،\nاین اصلاحات خارج از سقف رایگان پروژه است؛ استعلام هزینه ثبت شد.", "Revision requires fee", "Hi {{customer_name}},\nThis revision exceeds the free scope; a quote has been issued."),
    T("revision_free", "Revision included", "اصلاحات رایگان", "سلام {{customer_name}}،\nاین اصلاحات در سقف رایگان پروژه است و انجام می‌شود.", "Revision included", "Hi {{customer_name}},\nThis revision is within the free scope and will be done."),
    T("price_change", "Request price change", "تغییر قیمت", "سلام {{customer_name}}،\nتغییر قیمت «{{request_title}}» انجام شد.", "Request price change", "Hi {{customer_name}},\nThe price change \"{{request_title}}\" is done."),
    T("add_product", "Request new product", "افزودن محصول", "سلام {{customer_name}}،\nمحصول جدید به منو اضافه شد.", "Request new product", "Hi {{customer_name}},\nThe new product has been added to your menu."),
    T("photo_change", "Request photo replacement", "تعویض عکس", "سلام {{customer_name}}،\nعکس محصول با نسخه جدید جایگزین شد.", "Request photo replacement", "Hi {{customer_name}},\nThe product photo has been replaced."),
    T("add_category", "Request new category", "افزودن دسته", "سلام {{customer_name}}،\nدسته جدید اضافه شد.", "Request new category", "Hi {{customer_name}},\nThe new category has been added."),
    T("add_english", "Add English", "افزودن انگلیسی", "سلام {{customer_name}}،\nنسخه انگلیسی منو فعال شد.", "Add English", "Hi {{customer_name}},\nThe English version of your menu is live."),
    T("add_language", "Add third language", "افزودن زبان سوم", "سلام {{customer_name}}،\nزبان جدید به منو اضافه شد.", "Add third language", "Hi {{customer_name}},\nThe new language has been added to your menu."),
    T("add_admin", "Add admin panel", "افزودن پنل مدیریت", "سلام {{customer_name}}،\nدسترسی پنل مدیریت برای شما فعال شد.", "Add admin panel", "Hi {{customer_name}},\nYour admin panel access is ready."),
    T("add_ordering", "Add ordering", "راه‌اندازی سفارش‌گیری", "سلام {{customer_name}}،\nسفارش‌گیری روی منوی شما فعال شد.", "Add ordering", "Hi {{customer_name}},\nOrdering is now enabled on your menu."),
    T("add_gateway", "Add payment gateway", "اتصال درگاه پرداخت", "سلام {{customer_name}}،\nدرگاه پرداخت منوی شما متصل شد.", "Add payment gateway", "Hi {{customer_name}},\nYour payment gateway is connected."),
    T("add_qr", "Add QR table system", "QR میز", "سلام {{customer_name}}،\nکدهای QR میزها آماده دانلود است.", "Add QR table system", "Hi {{customer_name}},\nYour table QR codes are ready to download."),
    T("add_waiter", "Add call-waiter", "فراخوان گارسون", "سلام {{customer_name}}،\nماژول فراخوان گارسون فعال شد.", "Add call-waiter", "Hi {{customer_name}},\nThe call-waiter module is enabled."),
    T("add_branch", "Add branch", "افزودن شعبه", "سلام {{customer_name}}،\nشعبه جدید به حساب شما اضافه شد.", "Add branch", "Hi {{customer_name}},\nThe new branch has been added."),
    T("domain_instructions", "Domain setup instructions", "راهنمای تنظیم دامنه", "سلام {{customer_name}}،\nبرای اتصال {{domain}} این رکورد DNS را تنظیم کنید؛ بقیه کار با ما است.", "Domain setup instructions", "Hi {{customer_name}},\nTo connect {{domain}}, set this DNS record — we'll handle the rest."),
    T("need_domain", "Customer needs domain", "خرید دامنه", "سلام {{customer_name}}،\nبرای خرید دامنه، دامنه‌های پیشنهادی‌تان را بفرستید تا ثبت کنیم (به نام شما).", "Customer needs domain", "Hi {{customer_name}},\nSend us your preferred domain names and we'll register them under your ownership."),
    T("domain_misconfigured", "Customer domain misconfigured", "تنظیم نادرست دامنه", "سلام {{customer_name}}،\nرکورد DNS دامنه شما هنوز درست تنظیم نشده؛ راهنما را بررسی کنید.", "Customer domain misconfigured", "Hi {{customer_name}},\nYour DNS record isn't set correctly yet — please recheck the instructions."),
    T("renewal_reminder", "Hosting renewal approaching", "یادآوری تمدید", "سلام {{customer_name}}،\nهاستینگ منوی شما به‌زودی به پایان می‌رسد؛ برای جلوگیری از قطعی تمدید کنید.", "Hosting renewal approaching", "Hi {{customer_name}},\nYour menu hosting expires soon — renew to avoid interruption."),
    T("hosting_expired", "Hosting expired warning", "پایان هاستینگ", "سلام {{customer_name}}،\nهاستینگ منوی شما منقضی شده و منو در حالت فقط-خواندنی است.", "Hosting expired warning", "Hi {{customer_name}},\nYour hosting has expired; the menu is in read-only mode."),
    T("published", "Menu successfully published", "منو منتشر شد", "سلام {{customer_name}}،\nمنوی شما روی {{menu_url}} فعال شد. 🎉", "Menu successfully published", "Hi {{customer_name}},\nYour menu is live at {{menu_url}}. 🎉"),
    T("update_done", "Menu update completed", "به‌روزرسانی انجام شد", "سلام {{customer_name}}،\nبه‌روزرسانی «{{request_title}}» روی منو اعمال شد.", "Menu update completed", "Hi {{customer_name}},\nThe update \"{{request_title}}\" is live on your menu."),
    T("credit_insufficient", "Wallet/credit insufficient", "اعتبار ناکافی", "سلام {{customer_name}}،\nاعتبار شما برای این کار کافی نیست؛ از بخش کیف پول شارژ کنید.", "Wallet/credit insufficient", "Hi {{customer_name}},\nYour credit is insufficient for this work — top up from the wallet page."),
    T("credit_topup", "Credit top-up successful", "شارژ موفق", "سلام {{customer_name}}،\nشارژ {{price}} {{currency}} با موفقیت انجام شد. موجودی: {{wallet_balance}}.", "Credit top-up successful", "Hi {{customer_name}},\nYour top-up of {{price}} {{currency}} succeeded. Balance: {{wallet_balance}}."),
    T("refund_requested", "Refund requested", "ثبت درخواست بازگشت", "سلام {{customer_name}}،\nدرخواست بازگشت وجه شما ثبت شد و در صف بررسی است.", "Refund requested", "Hi {{customer_name}},\nYour refund request is recorded and queued for review."),
    T("refund_approved", "Refund approved", "تأیید بازگشت وجه", "سلام {{customer_name}}،\nدرخواست بازگشت وجه شما تأیید شد و در حال پردازش است.", "Refund approved", "Hi {{customer_name}},\nYour refund request is approved and being processed."),
    T("refund_rejected", "Refund rejected", "رد درخواست بازگشت", "سلام {{customer_name}}،\nدرخواست بازگشت وجه شما به این دلیل رد شد: {{estimated_scope}}", "Refund rejected", "Hi {{customer_name}},\nYour refund request was rejected for this reason: {{estimated_scope}}"),
    T("refund_processing", "Refund processing", "در حال پردازش بازگشت", "سلام {{customer_name}}،\nبازگشت وجه به مسیر بانکی ارسال شد.", "Refund processing", "Hi {{customer_name}},\nYour refund has been submitted to the banking route."),
    T("refund_completed", "Refund completed", "بازگشت وجه کامل شد", "سلام {{customer_name}}،\nبازگشت وجه به‌طور کامل انجام شد.", "Refund completed", "Hi {{customer_name}},\nYour refund is complete."),
    T("support_ack", "Support acknowledgment", "ثبت تیکت پشتیبانی", "سلام {{customer_name}}،\nتیکت شما ثبت شد و در ساعات کاری پاسخ می‌دهیم.", "Support acknowledgment", "Hi {{customer_name}},\nYour ticket is registered; we'll reply during business hours."),
    T("urgent_fee", "Urgent support fee", "پشتیبانی فوری", "سلام {{customer_name}}،\nپشتیبانی فوری هزینه اضافه دارد؛ استعلام ثبت شد.", "Urgent support fee", "Hi {{customer_name}},\nUrgent support carries an extra fee; a quote has been issued."),
    T("custom_quote", "Custom feature requires quote", "امکان سفارشی", "سلام {{customer_name}}،\nاین امکان سفارشی نیازمند بررسی و استعلام است.", "Custom feature requires quote", "Hi {{customer_name}},\nThis custom feature needs review before quoting."),
    T("waiting_client", "Project delayed waiting on client", "انتظار برای مشتری", "سلام {{customer_name}}،\nپروژه منتظر ورودی شماست؛ پس از دریافت ادامه می‌دهیم.", "Project delayed waiting on client", "Hi {{customer_name}},\nThe project is waiting on your input; we'll continue once received."),
    T("project_completed", "Project completed", "پروژه کامل شد", "سلام {{customer_name}}،\nپروژه شما کامل شد؛ منوی شما روی {{menu_url}} فعال است.", "Project completed", "Hi {{customer_name}},\nYour project is complete; your menu is live at {{menu_url}}."),
    T("final_approval", "Ask for final approval", "درخواست تأیید نهایی", "سلام {{customer_name}}،\nاگر منو مطابق انتظار است، تأیید نهایی را از پنل ثبت کنید.", "Ask for final approval", "Hi {{customer_name}},\nIf the menu looks right, please record your final approval from the dashboard."),
    T("testimonial_request", "Request testimonial", "درخواست نظر", "سلام {{customer_name}}،\nاگر از منو راضی هستید، خوشحال می‌شویم نظر واقعی‌تان را برای انتشار بفرستید.", "Request testimonial", "Hi {{customer_name}},\nIf you're happy with your menu, we'd love a real testimonial to publish."),
    T("security_incident", "Security incident notification", "رویداد امنیتی", "سلام {{customer_name}}،\nرویداد امنیتی در حساب شما ثبت شد؛ نشست‌ها را بررسی کنید.", "Security incident notification", "Hi {{customer_name}},\nA security event was recorded on your account; please review sessions."),
    T("security_recommendation", "Password/security recommendation", "توصیه امنیتی", "سلام {{customer_name}}،\nفعال‌سازی ورود دو مرحله‌ای را توصیه می‌کنیم.", "Password/security recommendation", "Hi {{customer_name}},\nWe recommend enabling two-factor authentication."),
    T("payment_failed", "Failed payment", "پرداخت ناموفق", "سلام {{customer_name}}،\nپرداخت {{invoice_number}} ناموفق بود؛ مبلغی کسر نشده است.", "Failed payment", "Hi {{customer_name}},\nPayment for {{invoice_number}} failed — no amount was taken."),
    T("duplicate_payment", "Duplicate payment review", "پرداخت تکراری", "سلام {{customer_name}}،\nپرداخت تکراری شناسایی شد و در حال بررسی برای بازگشت است.", "Duplicate payment review", "Hi {{customer_name}},\nA duplicate payment was detected and is being reviewed for refund."),
    T("payment_verify_issue", "Payment verification issue", "مشکل تأیید پرداخت", "سلام {{customer_name}}،\nتأیید پرداخت با مشکل مواجه شد؛ تیم مالی بررسی می‌کند.", "Payment verification issue", "Hi {{customer_name}},\nPayment verification hit an issue; our finance team is on it."),
    T("menu_unavailable", "Menu temporarily unavailable", "منو موقتاً در دسترس نیست", "سلام {{customer_name}}،\nمنوی شما موقتاً در دسترس نیست؛ به‌زودی برمی‌گردد.", "Menu temporarily unavailable", "Hi {{customer_name}},\nYour menu is temporarily unavailable and will be back shortly."),
    T("maintenance", "Scheduled maintenance", "تعلیق برنامه‌ریزی‌شده", "سلام {{customer_name}}،\nبه‌روزرسانی برنامه‌ریزی‌شده در این بازه انجام می‌شود.", "Scheduled maintenance", "Hi {{customer_name}},\nScheduled maintenance happens during this window."),
    T("import_issues", "Import file has validation issues", "خطای فایل ورود اطلاعات", "سلام {{customer_name}}،\nبرخی ردیف‌های فایل شما مشکل دارد؛ جزئیات در پنل است.", "Import file has validation issues", "Hi {{customer_name}},\nSome rows in your file have issues — details are in your dashboard."),
    T("pdf_confirm", "PDF/image extraction requires confirmation", "تأیید استخراج محتوا", "سلام {{customer_name}}،\nمحتوای استخراج‌شده از فایل شما نیاز به تأیید شما دارد.", "PDF/image extraction requires confirmation", "Hi {{customer_name}},\nThe content extracted from your file needs your confirmation."),
    T("ssl_active", "Custom-domain SSL active", "SSL فعال شد", "سلام {{customer_name}}،\nگواهی SSL برای {{domain}} فعال شد.", "Custom-domain SSL active", "Hi {{customer_name}},\nSSL is active for {{domain}}."),
    T("package_changed", "Client changed package", "تغییر پکیج", "سلام {{customer_name}}،\nپکیج شما به‌روزرسانی شد.", "Client changed package", "Hi {{customer_name}},\nYour package has been updated."),
    T("cancellation", "Cancellation", "لغو", "سلام {{customer_name}}،\nلغو شما ثبت شد؛ مطابق سیاست بازگشت وجه عمل می‌شود.", "Cancellation", "Hi {{customer_name}},\nYour cancellation is recorded; the refund policy applies."),
    T("deletion_confirm", "Account deletion request confirmation", "درخواست حذف حساب", "سلام {{customer_name}}،\nدرخواست حذف حساب شما ثبت شد؛ پس از بررسی‌های قانونی انجام می‌شود.", "Account deletion request confirmation", "Hi {{customer_name}},\nYour account deletion request is recorded and will be processed after legal checks."),
  ];
  for (const t of templates) {
    const existFa = (await db.select().from(schema.messageTemplates).where(eq(schema.messageTemplates.key, t.key)).limit(1))[0];
    if (existFa) continue;
    await db.insert(schema.messageTemplates).values([
      { id: randomUUID(), key: t.key, scenario: t.scenario, locale: "fa", subject: t.faSub, body: t.faBody },
      { id: randomUUID(), key: t.key, scenario: t.scenario, locale: "en", subject: t.enSub, body: t.enBody },
    ]);
  }

  console.log("→ seeding demo menus…");
  const { demos } = await import("../content/demos/index");
  const { buildReadModel } = await import("../src/domains/menu-engine/publish");

  // A system owner for demo content.
  let owner = (await db.select().from(schema.user).where(eq(schema.user.email, "system@foryxo.local")).limit(1))[0];
  if (!owner) {
    const [created] = await db
      .insert(schema.user)
      .values({ id: randomUUID(), name: "Foryxo System", email: "system@foryxo.local", role: "superadmin", emailVerified: true })
      .returning();
    owner = created;
  }

  for (const demo of demos) {
    const existingMenu = (await db.select().from(schema.menus).where(eq(schema.menus.slug, demo.id)).limit(1))[0];
    if (existingMenu) {
      console.log(`  · menu ${demo.id} exists, skipping`);
      continue;
    }

    const [biz] = await db
      .insert(schema.businesses)
      .values({
        id: randomUUID(),
        ownerUserId: owner.id,
        name: demo.nameFa,
        nameEn: demo.name,
        slug: `demo-${demo.id}`,
        businessType: demo.id === "crush" ? "fastfood" : demo.id === "khesht" ? "iranian" : demo.id === "miette" ? "bakery" : demo.id === "form" ? "healthy" : "cafe",
        status: "active",
      })
      .returning();
    await db.insert(schema.businessMembers).values({ id: randomUUID(), businessId: biz.id, userId: owner.id, role: "owner" });

    const [menu] = await db
      .insert(schema.menus)
      .values({
        id: randomUUID(),
        businessId: biz.id,
        slug: demo.id,
        title: demo.nameFa,
        titleEn: demo.name,
        description: demo.tagline.fa,
        descriptionEn: demo.tagline.en,
        locales: ["fa", "en"],
        colorMode: demo.colorMode,
        isDemo: true,
        indexable: true,
        seoTitle: `${demo.nameFa} | منوی آنلاین`,
        seoDescription: demo.tagline.fa,
      })
      .returning();

    const [v1] = await db
      .insert(schema.menuVersions)
      .values({ id: randomUUID(), menuId: menu.id, version: 1, status: "draft", createdBy: owner.id })
      .returning();

    for (const [ci, cat] of demo.categories.entries()) {
      const [c] = await db
        .insert(schema.categories)
        .values({
          id: randomUUID(),
          menuId: menu.id,
          versionId: v1.id,
          slug: cat.slug,
          sort: ci,
          daypartStart: cat.daypart?.start ?? null,
          daypartEnd: cat.daypart?.end ?? null,
          icon: cat.icon ?? null,
        })
        .returning();
      await db.insert(schema.categoryTranslations).values([
        { id: randomUUID(), categoryId: c.id, locale: "fa", name: cat.name.fa },
        { id: randomUUID(), categoryId: c.id, locale: "en", name: cat.name.en },
      ]);

      for (const [pi, p] of cat.products.entries()) {
        const prod = await db
          .insert(schema.products)
          .values({
            id: randomUUID(),
            menuId: menu.id,
            versionId: v1.id,
            categoryId: c.id,
            slug: p.slug,
            sort: pi,
            price: p.price,
            currency: "IRT",
            allowsCustomRequest: p.allowsCustomRequest ?? false,
            badges: p.badges ?? null,
            nutrition: p.nutrition ?? null,
            allergens: p.allergens ?? null,
            dietary: p.dietary ?? null,
            imagePrompt: p.imagePrompt,
            searchText: `${p.name.fa} ${p.name.en} ${p.description.fa} ${p.description.en}`.toLowerCase(),
          })
          .returning();
        await db.insert(schema.productTranslations).values([
          { id: randomUUID(), productId: prod[0].id, locale: "fa", name: p.name.fa, description: p.description.fa },
          { id: randomUUID(), productId: prod[0].id, locale: "en", name: p.name.en, description: p.description.en },
        ]);

        if (p.modifiers?.length) {
          for (const [gi, g] of p.modifiers.entries()) {
            const [mg] = await db
              .insert(schema.modifierGroups)
              .values({
                id: randomUUID(),
                menuId: menu.id,
                versionId: v1.id,
                slug: `${p.slug}-${g.slug}`,
                minSelect: g.min,
                maxSelect: g.max,
                isRequired: Boolean(g.required),
                sort: gi,
              })
              .returning();
            await db.insert(schema.modifierGroupTranslations).values([
              { id: randomUUID(), groupId: mg.id, locale: "fa", name: g.name.fa },
              { id: randomUUID(), groupId: mg.id, locale: "en", name: g.name.en },
            ]);
            await db.insert(schema.productModifierGroups).values({
              id: randomUUID(),
              productId: prod[0].id,
              groupId: mg.id,
              sort: gi,
            });
            for (const [oi, o] of g.options.entries()) {
              const [mod] = await db
                .insert(schema.modifiers)
                .values({ id: randomUUID(), groupId: mg.id, priceDelta: o.delta, isDefault: Boolean(o.default), sort: oi })
                .returning();
              await db.insert(schema.modifierTranslations).values([
                { id: randomUUID(), modifierId: mod.id, locale: "fa", name: o.name.fa },
                { id: randomUUID(), modifierId: mod.id, locale: "en", name: o.name.en },
              ]);
            }
          }
        }
      }
    }

    // Publish v1 with read model.
    const readModel = await buildReadModel(menu.id, v1.id);
    await db
      .update(schema.menuVersions)
      .set({ status: "published", readModel, contentHash: readModel.contentHash, publishedAt: new Date() })
      .where(eq(schema.menuVersions.id, v1.id));
    await db
      .update(schema.menus)
      .set({ status: "published", publishedVersionId: v1.id })
      .where(eq(schema.menus.id, menu.id));
    const [draftV2] = await db
      .insert(schema.menuVersions)
      .values({ id: randomUUID(), menuId: menu.id, version: 2, status: "draft" })
      .returning();
    await db.update(schema.menus).set({ draftVersionId: draftV2.id }).where(eq(schema.menus.id, menu.id));

    console.log(`  ✓ demo menu ${demo.id} published`);
  }

  // Dev-only demo accounts
  if (env.AUTH_DEV_OTP && !isProd) {
    console.log("→ seeding dev accounts (OTP via console)…");
    const devUsers: { email: string; name: string; role: string }[] = [
      { email: "admin@dev.local", name: "Dev Admin", role: "superadmin" },
      { email: "cafe@dev.local", name: "Dev Café Owner", role: "business" },
      { email: "guest@dev.local", name: "Dev Consumer", role: "consumer" },
    ];
    for (const du of devUsers) {
      const exists = (await db.select().from(schema.user).where(eq(schema.user.email, du.email)).limit(1))[0];
      if (exists) continue;
      await db.insert(schema.user).values({
        id: randomUUID(),
        name: du.name,
        email: du.email,
        role: du.role,
        emailVerified: true,
      });
    }
    console.log("  ✓ admin@dev.local / cafe@dev.local / guest@dev.local — sign in with email OTP (code in server console)");
  }

  console.log("✓ Seed complete");
}

main()
  .then(async () => {
    const { closeDb } = await import("../src/domains/db/client");
    await closeDb();
  })
  .catch(async (e) => {
    console.error(e);
    try {
      const { closeDb } = await import("../src/domains/db/client");
      await closeDb();
    } catch {
      // Initialization itself failed; there may be no client to close.
    }
    process.exitCode = 1;
  });
