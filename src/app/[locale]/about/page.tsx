import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return {
    title: t.nav.about,
    description: t.common.brandTagline,
    alternates: alternatesFor(l, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);

  const principles = fa
    ? [
        { title: "شفافیت", body: "قیمت‌ها را جلوی کار می‌گذاریم؛ برآورد را قبل از هر پرداختی می‌بینید و هیچ کاری بدون تأیید شما شروع نمی‌شود." },
        { title: "هویت برند", body: "منوی شما یک کپی از قالب دیگران نیست. طرح پایه را انتخاب می‌کنید و ما آن را با نام، رنگ و زبان شما می‌سازیم." },
        { title: "سرعت واقعی", body: "منو در چند روز کاری آماده می‌شود و مهمان‌ها آن را بدون نصب اپ و بدون ثبت‌نام، فوراً می‌بینند." },
        { title: "بدون ادعای اثبات‌نشده", body: "آمار و نظرها را وقتی منتشر می‌کنیم که واقعی باشند. همین." },
      ]
    : [
        { title: "Transparency", body: "Pricing is out in the open; you see an estimate before any payment, and nothing starts without your approval." },
        { title: "Brand identity", body: "Your menu is not a copy of someone else's template. Pick a base design and we rebuild it around your name, colors and languages." },
        { title: "Real speed", body: "Menus go live in days, and guests open them instantly — no app install, no signup." },
        { title: "No unproven claims", body: "We publish stats and testimonials only when they are real. That's it." },
      ];

  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-4xl px-4 pb-20 pt-12">
        <h1 className="display-1">{t.nav.about}</h1>
        <p className="lede mt-4">
          {fa
            ? "فوریکسو منو یک سرویس تخصصی ساخت منوی دیجیتال برای کافه‌ها، رستوران‌ها، فست‌فودها و قنادی‌هاست. ما معتقدیم منوی دیجیتال باید مثل هویت برند شما باشد: سریع، زیبا، دوزبانه و همیشه به‌روز."
            : "Foryxo Menu is a specialized service that builds digital menus for cafés, restaurants, fast-food and bakeries. We believe a digital menu should carry your brand identity: fast, beautiful, bilingual and always current."}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="surface rounded-2xl p-6">
              <h2 className="font-extrabold">{p.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 surface-subtle rounded-2xl p-6">
          <h2 className="font-extrabold">{fa ? "تماس" : "Contact"}</h2>
          <p className="mt-2 text-sm text-muted">
            {fa ? "از صفحه تماس می‌توانید درخواست خود را ثبت کنید." : "Use the contact page to submit your inquiry."}{" "}
          </p>
        </div>
      </section>
    </PageShell>
  );
}
