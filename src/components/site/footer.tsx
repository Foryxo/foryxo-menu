import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

export function SiteFooter({ locale }: { locale: "fa" | "en" }) {
  const fa = locale === "fa";
  const year = new Date().getFullYear();
  const cols = fa
    ? [
        {
          title: "محصول",
          links: [
            { href: `/${locale}/demos`, label: "دموها" },
            { href: `/${locale}/pricing`, label: "تعرفه‌ها" },
            { href: `/${locale}/features`, label: "امکانات" },
            { href: `/${locale}/how-it-works`, label: "چطور کار می‌کند" },
            { href: `/${locale}/projects`, label: "پروژه‌های انجام‌شده" },
          ],
        },
        {
          title: "شرکت",
          links: [
            { href: `/${locale}/about`, label: "درباره ما" },
            { href: `/${locale}/contact`, label: "تماس" },
            { href: `/${locale}/blog`, label: "وبلاگ" },
          ],
        },
        {
          title: "قوانین",
          links: [
            { href: `/${locale}/terms`, label: "شرایط استفاده" },
            { href: `/${locale}/privacy`, label: "حریم خصوصی" },
            { href: `/${locale}/refund-policy`, label: "بازگشت وجه" },
            { href: `/${locale}/security`, label: "امنیت" },
          ],
        },
      ]
    : [
        {
          title: "Product",
          links: [
            { href: "/en/demos", label: "Demos" },
            { href: "/en/pricing", label: "Pricing" },
            { href: "/en/features", label: "Features" },
            { href: "/en/how-it-works", label: "How it works" },
            { href: "/en/projects", label: "Completed projects" },
          ],
        },
        {
          title: "Company",
          links: [
            { href: "/en/about", label: "About" },
            { href: "/en/contact", label: "Contact" },
            { href: "/en/blog", label: "Blog" },
          ],
        },
        {
          title: "Legal",
          links: [
            { href: "/en/terms", label: "Terms" },
            { href: "/en/privacy", label: "Privacy" },
            { href: "/en/refund-policy", label: "Refund policy" },
            { href: "/en/security", label: "Security" },
          ],
        },
      ];

  return (
    <footer className="border-t border-line bg-elevated">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2 font-extrabold">
            <BrandMark size={48} className="size-12" />
            Foryxo Menu
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">
            {fa
              ? "منوی دیجیتال دوزبانه با هویت برند خودتان — بدون نیاز به نرم‌افزار."
              : "Bilingual digital menus with your own brand identity — no app required."}
          </p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3 className="mb-3 text-sm font-bold">{c.title}</h3>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {year} Foryxo Menu · {fa ? "همه حقوق محفوظ است." : "All rights reserved."}
      </div>
    </footer>
  );
}
