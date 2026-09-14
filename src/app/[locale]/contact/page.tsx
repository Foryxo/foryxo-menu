import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return { title: t.nav.contact, description: t.nav.contact, alternates: alternatesFor(l, "/contact") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);

  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-12">
        <h1 className="display-1">{t.nav.contact}</h1>
        <p className="lede mt-3">
          {fa
            ? "فرم زیر را پر کنید؛ کارشناسان ما در ساعات کاری پاسخ می‌دهند."
            : "Fill in the form below; our team replies during business hours."}
        </p>
        <div className="mt-10">
          <ContactForm locale={l} submitLabel={t.common.submitRequest} successLabel={fa ? "پیام شما ثبت شد. به‌زودی تماس می‌گیریم." : "Message received. We'll be in touch soon."} nameLabel={fa ? "نام" : "Name"} businessLabel={fa ? "نام کسب‌وکار" : "Business name"} contactLabel={fa ? "ایمیل یا موبایل" : "Email or mobile"} messageLabel={fa ? "پیام" : "Message"} errorLabel={t.common.error} />
        </div>
      </section>
    </PageShell>
  );
}
