import type { Metadata } from "next";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";
import { LegalBody, LegalShell } from "@/components/site/legal-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return { title: t.legal.terms, alternates: alternatesFor(l, "/terms") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  const fa = l === "fa";

  return (
    <LegalShell locale={l}>
      <LegalBody
        title={t.legal.terms}
        intro={
          fa
            ? "این شرایط نحوه استفاده از خدمات فوریکسو منو را توضیح می‌دهد."
            : "These terms govern the use of Foryxo Menu services."
        }
        warning={t.legal.draftWarning}
        updatedFa="آخرین بازبینی:"
        updatedEn="Last reviewed:"
        sections={
          fa
            ? [
                { h: "۱. خدمات", p: "فوریکسو منو طراحی، میزبانی و پشتیبانی منوی دیجیتال را طبق پکیج انتخابی شما ارائه می‌کند. شرح دقیق خدمات در استعلام و فاکتور هر پروژه آمده است." },
                { h: "۲. حساب کاربری", p: "شما مسئول صحت اطلاعات حساب و محرمانه ماندن دسترسی‌هایتان هستید. فعالیت مشکوک را فوراً گزارش کنید." },
                { h: "۳. محتوا و مالکیت", p: "مالکیت محتوایی که آپلود می‌کنید (عکس، لوگو، متن منو) با شماست. با آپلود، به ما اجازهٔ استفاده برای ارائهٔ خدمات منوی شما را می‌دهید." },
                { h: "۴. پرداخت و اعتبار", p: "خدمات با پرداخت آنلاین یا اعتبار خدمات فوریکسو تسویه می‌شود. اعتبار خدمات فقط برای خرید خدمات فوریکسو استفاده می‌شود و سپرده بانکی نیست. هیچ کاری بدون تأیید استعلام از اعتبار شما کسر نمی‌شود." },
                { h: "۵. دامنه", p: "در صورت ثبت دامنه به کمک ما، مالکیت دامنه از ابتدا به نام شما ثبت می‌شود و همیشه می‌توانید آن را منتقل کنید." },
                { h: "۶. تعلیق و خاتمه", p: "در صورت نقض این شرایط، فعالیت مشکوک یا عدم پرداخت، می‌توانیم خدمات را موقتاً محدود کنیم؛ با ذکر دلیل و اطلاع قبلی مگر در موارد امنیتی فوری." },
                { h: "۷. تغییر شرایط", p: "تغییرات مهم شرایط را حداقل ۱۴ روز قبل از اعمال اطلاع می‌دهیم." },
              ]
            : [
                { h: "1. Services", p: "Foryxo Menu provides digital-menu design, hosting and support according to your chosen package. The exact scope appears in each project's quote and invoice." },
                { h: "2. Accounts", p: "You are responsible for the accuracy of your account information and for keeping your credentials secure. Report suspicious activity immediately." },
                { h: "3. Content & ownership", p: "You own the content you upload (photos, logos, menu text). By uploading, you grant us the right to use it to deliver your menu service." },
                { h: "4. Payment & credit", p: "Services are settled by online payment or Foryxo Service Credit. Service credit is usable only for Foryxo services and is not a bank deposit. Nothing is charged without your quote approval." },
                { h: "5. Domains", p: "When we assist with domain registration, ownership is registered in your name from day one and can be transferred at any time." },
                { h: "6. Suspension & termination", p: "We may limit the service for terms violations, suspicious activity or non-payment — with stated reason and prior notice except in urgent security cases." },
                { h: "7. Changes to terms", p: "Material changes will be announced at least 14 days before taking effect." },
              ]
        }
      />
    </LegalShell>
  );
}
