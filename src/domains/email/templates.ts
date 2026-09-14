/**
 * Bilingual transactional email templates (spec §62).
 * Rendered server-side; every send includes a plain-text alternative.
 */
export type EmailTemplateKey =
  | "otp"
  | "welcome"
  | "payment_receipt"
  | "quote"
  | "refund_status"
  | "project_update"
  | "menu_published"
  | "renewal"
  | "security_event";

interface TemplateVars {
  [k: string]: string | number | undefined;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEmail(
  key: EmailTemplateKey,
  vars: TemplateVars,
  locale: "fa" | "en" = "fa",
): string {
  const v = (k: string) => esc(String(vars[k] ?? ""));
  const fa = locale === "fa";

  const shell = (inner: string) => `<!doctype html>
<html dir="${fa ? "rtl" : "ltr"}" lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f2f4f8;font-family:Vazirmatn,Segoe UI,Tahoma,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e7ef;">
    <div style="background:#2347c8;padding:20px 28px;">
      <span style="color:#fff;font-weight:800;font-size:18px;">Foryxo Menu</span>
    </div>
    <div style="padding:28px;">${inner}</div>
    <div style="padding:16px 28px;background:#f7f8fa;color:#68758d;font-size:12px;">
      ${fa ? "این ایمیل در پاسخ به درخواست شما ارسال شده است." : "You received this email because of activity on your Foryxo Menu account."}
      <br>menu.foryxo.com
    </div>
  </div>
</div>
</body></html>`;

  switch (key) {
    case "otp":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "کد ورود شما" : "Your sign-in code"}</h1>
        <p style="color:#525d73;">${
          fa
            ? "از این کد برای ورود به حساب فوریکسو منو استفاده کنید. کد ۵ دقیقه اعتبار دارد."
            : "Use this code to sign in to Foryxo Menu. It expires in 5 minutes."
        }</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;background:#e8eeff;color:#2347c8;font-size:32px;font-weight:800;letter-spacing:8px;padding:16px 28px;border-radius:12px;">${v("otp")}</span>
        </div>
        <p style="color:#68758d;font-size:13px;">${
          fa ? "اگر شما درخواست نداده‌اید، این ایمیل را نادیده بگیرید." : "If you didn't request this, ignore this email."
        }</p>`);

    case "welcome":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "خوش آمدید 👋" : "Welcome 👋"}</h1>
        <p style="color:#525d73;">${
          fa
            ? `سلام ${v("name")}، حساب شما در فوریکسو منو ساخته شد. از پنل کاربری می‌توانید پروژه منو را دنبال کنید.`
            : `Hi ${v("name")}, your Foryxo Menu account is ready. Track your menu project from the dashboard.`
        }</p>
        <a href="${v("link") || "https://menu.foryxo.com"}" style="display:inline-block;background:#2347c8;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:8px;">${fa ? "ورود به پنل" : "Open dashboard"}</a>`);

    case "payment_receipt":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "پرداخت تأیید شد" : "Payment confirmed"}</h1>
        <p style="color:#525d73;">${
          fa
            ? `پرداخت مبلغ ${v("amount")} تومان با شماره پیگیری ${v("ref")} با موفقیت انجام شد.`
            : `Your payment of ${v("amount")} Toman (ref ${v("ref")}) was confirmed.`
        }</p>`);

    case "quote":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "استعلام هزینه شما آماده است" : "Your quote is ready"}</h1>
        <p style="color:#525d73;">${
          fa
            ? `استعلام برای «${v("title")}» به مبلغ ${v("amount")} تومان در پنل شما ثبت شد. تا پیش از تأیید شما هیچ مبلغی کسر نمی‌شود.`
            : `The quote for "${v("title")}" (${v("amount")} Toman) is in your dashboard. Nothing is charged until you approve.`
        }</p>`);

    case "refund_status":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "وضعیت بازگشت وجه" : "Refund status"}</h1>
        <p style="color:#525d73;">${
          fa
            ? `درخواست بازگشت وجه ${v("amount")} تومان به وضعیت «${v("status")}» تغییر کرد.`
            : `Your refund request of ${v("amount")} Toman is now "${v("status")}".`
        }</p>`);

    case "project_update":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "به‌روزرسانی پروژه" : "Project update"}</h1>
        <p style="color:#525d73;">${v("message")}</p>`);

    case "menu_published":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "منوی شما منتشر شد 🎉" : "Your menu is live 🎉"}</h1>
        <p style="color:#525d73;">${fa ? "منوی شما روی آدرس زیر فعال است:" : "Your menu is live at:"}</p>
        <p><a href="${v("url")}">${v("url")}</a></p>`);

    case "renewal":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "یادآوری تمدید" : "Renewal reminder"}</h1>
        <p style="color:#525d73;">${v("message")}</p>`);

    case "security_event":
      return shell(`
        <h1 style="margin:0 0 12px;font-size:20px;">${fa ? "رویداد امنیتی" : "Security notice"}</h1>
        <p style="color:#525d73;">${v("message")}</p>
        <p style="color:#68758d;font-size:13px;">${
          fa ? "اگر این فعالیت شما نبوده، فوراً رمز عبور را تغییر دهید و نشست‌ها را لغو کنید." : "If this wasn't you, change your password and revoke sessions immediately."
        }</p>`);
  }
}

/** Safe plain-text extraction for the text part. */
export function emailTextAlternative(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
