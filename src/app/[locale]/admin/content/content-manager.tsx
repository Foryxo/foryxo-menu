"use client";
import { useRef, useState, type FormEvent } from "react";
import { Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/primitives";

export function ContentManager({ locale }: { locale: "fa" | "en" }) {
  const fa = locale === "fa";
  const [type, setType] = useState<"portfolio" | "demo" | "blog">("portfolio");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  async function upload(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("businessId", "platform");
      fd.set("kind", "content");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setImageUrl(data.url);
      setMessage(fa ? "تصویر آماده است." : "Image uploaded.");
    } catch {
      setMessage(fa ? "بارگذاری ناموفق بود." : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const common = {
      action: "create",
      entity: type,
      slug: String(fd.get("slug")),
      status: String(fd.get("status")),
    };
    let payload: Record<string, unknown>;
    if (type === "portfolio")
      payload = {
        ...common,
        titleFa: fd.get("titleFa"),
        titleEn: fd.get("titleEn"),
        summaryFa: fd.get("summaryFa"),
        summaryEn: fd.get("summaryEn"),
        clientName: fd.get("clientName"),
        serviceFa: fd.get("serviceFa"),
        serviceEn: fd.get("serviceEn"),
        liveUrl: fd.get("liveUrl"),
        coverImageUrl: imageUrl || undefined,
        featured: fd.get("featured") === "on",
      };
    else if (type === "demo")
      payload = {
        ...common,
        titleFa: fd.get("titleFa"),
        titleEn: fd.get("titleEn"),
        descriptionFa: fd.get("summaryFa"),
        descriptionEn: fd.get("summaryEn"),
        previewImageUrl: imageUrl,
        liveMenuUrl: fd.get("liveUrl"),
      };
    else
      payload = {
        ...common,
        locale: fd.get("postLocale"),
        title: fd.get("title"),
        excerpt: fd.get("excerpt"),
        content: fd.get("content"),
        category: fd.get("category"),
        heroUrl: imageUrl || undefined,
        seoTitle: fd.get("seoTitle"),
        seoDescription: fd.get("seoDescription"),
      };
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setMessage(fa ? "با موفقیت ذخیره شد." : "Saved successfully.");
      e.currentTarget.reset();
      setImageUrl("");
      window.location.reload();
    } catch {
      setMessage(
        fa
          ? "ذخیره نشد؛ فیلدها و تکراری نبودن اسلاگ را بررسی کنید."
          : "Could not save; check fields and slug uniqueness.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="surface rounded-2xl p-5">
      <div className="flex flex-wrap gap-2">
        {(["portfolio", "demo", "blog"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setType(item);
              setImageUrl("");
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${type === item ? "accent-bg" : "bg-subtle text-muted"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">
          <span className="mb-1.5 block">Slug</span>
          <Input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            dir="ltr"
            placeholder="project-name"
          />
        </label>
        <label className="text-sm font-bold">
          <span className="mb-1.5 block">{fa ? "وضعیت" : "Status"}</span>
          <Select name="status" defaultValue="draft">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </label>
        {type !== "blog" ? (
          <>
            <label className="text-sm font-bold">
              <span className="mb-1.5 block">
                {fa ? "عنوان فارسی" : "Persian title"}
              </span>
              <Input name="titleFa" required dir="rtl" />
            </label>
            <label className="text-sm font-bold">
              <span className="mb-1.5 block">English title</span>
              <Input name="titleEn" required dir="ltr" />
            </label>
            <label className="text-sm font-bold">
              <span className="mb-1.5 block">
                {fa ? "توضیح فارسی" : "Persian summary"}
              </span>
              <Textarea name="summaryFa" required dir="rtl" rows={4} />
            </label>
            <label className="text-sm font-bold">
              <span className="mb-1.5 block">English summary</span>
              <Textarea name="summaryEn" required dir="ltr" rows={4} />
            </label>
            <label className="text-sm font-bold md:col-span-2">
              <span className="mb-1.5 block">
                {type === "demo"
                  ? fa
                    ? "لینک منوی زنده"
                    : "Live menu URL"
                  : fa
                    ? "لینک پروژه"
                    : "Project URL"}
              </span>
              <Input
                name="liveUrl"
                required
                dir="ltr"
                placeholder="https://… or /menus/slug"
              />
            </label>
            {type === "portfolio" ? (
              <>
                <label className="text-sm font-bold">
                  <span className="mb-1.5 block">
                    {fa ? "نام مشتری" : "Client name"}
                  </span>
                  <Input name="clientName" />
                </label>
                <label className="text-sm font-bold">
                  <span className="mb-1.5 block">
                    {fa ? "نوع خدمت فارسی" : "Service (Persian)"}
                  </span>
                  <Input name="serviceFa" />
                </label>
                <label className="text-sm font-bold">
                  <span className="mb-1.5 block">Service (English)</span>
                  <Input name="serviceEn" />
                </label>
                <label className="flex items-center gap-2 self-end text-sm font-bold">
                  <input type="checkbox" name="featured" className="size-4" />
                  {fa ? "پروژه ویژه" : "Featured project"}
                </label>
              </>
            ) : null}
          </>
        ) : (
          <>
            <label className="text-sm font-bold">
              <span className="mb-1.5 block">
                {fa ? "زبان نوشته" : "Post locale"}
              </span>
              <Select name="postLocale">
                <option value="fa">Persian</option>
                <option value="en">English</option>
              </Select>
            </label>
            <label className="text-sm font-bold">
              <span className="mb-1.5 block">{fa ? "دسته" : "Category"}</span>
              <Input name="category" />
            </label>
            <label className="text-sm font-bold md:col-span-2">
              <span className="mb-1.5 block">{fa ? "عنوان" : "Title"}</span>
              <Input name="title" required />
            </label>
            <label className="text-sm font-bold md:col-span-2">
              <span className="mb-1.5 block">{fa ? "خلاصه" : "Excerpt"}</span>
              <Textarea name="excerpt" required rows={3} />
            </label>
            <label className="text-sm font-bold md:col-span-2">
              <span className="mb-1.5 block">{fa ? "محتوا" : "Content"}</span>
              <Textarea
                name="content"
                required
                rows={10}
                placeholder={
                  fa
                    ? "پاراگراف‌ها را با یک خط خالی جدا کنید."
                    : "Separate paragraphs with a blank line."
                }
              />
            </label>
            <label className="text-sm font-bold">
              <span className="mb-1.5 block">SEO title</span>
              <Input name="seoTitle" />
            </label>
            <label className="text-sm font-bold">
              <span className="mb-1.5 block">SEO description</span>
              <Input name="seoDescription" />
            </label>
          </>
        )}
        <div className="rounded-xl border border-dashed border-line p-4 md:col-span-2">
          <input
            ref={fileRef}
            type="file"
            aria-label={fa ? "بارگذاری تصویر محتوا" : "Upload content image"}
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Upload className="size-4" />
            {fa ? "بارگذاری تصویر" : "Upload image"}
          </Button>
          {imageUrl ? (
            <p className="mt-2 truncate text-xs text-emerald-600" dir="ltr">
              {imageUrl}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {fa
                ? "برای دمو تصویر اجباری است؛ برای وبلاگ و پروژه اختیاری."
                : "Required for demos; optional for blog and projects."}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Button type="submit" loading={busy}>
            <Send className="size-4" />
            {fa ? "ذخیره محتوا" : "Save content"}
          </Button>
          {message ? (
            <p className="mt-2 text-sm text-muted" role="status">
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

export function StatusButton({
  entity,
  id,
  status,
  locale,
}: {
  entity: "portfolio" | "demo" | "blog";
  id: string;
  status: string;
  locale: "fa" | "en";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = status === "published" ? "draft" : "published";
  return (
    <div>
    <Button
      size="sm"
      variant="outline"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        setError("");
        try {
          const response = await fetch("/api/admin/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "setStatus",
              entity,
              id,
              status: next,
            }),
          });
          if (!response.ok) throw new Error("status_update_failed");
          window.location.reload();
        } catch {
          setError(locale === "fa" ? "تغییر وضعیت انجام نشد." : "Status update failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {locale === "fa"
        ? next === "published"
          ? "انتشار"
          : "پیش‌نویس"
        : next === "published"
          ? "Publish"
          : "Unpublish"}
    </Button>
    {error ? <p className="mt-1 max-w-32 text-xs text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
