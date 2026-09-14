"use client";

/**
 * Menu renderer — one renderer for every client (spec §21).
 * Theme comes entirely from CSS custom properties set by MenuThemeStyle,
 * so each menu can be radically different without code forks.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MenuReadModel, ReadModelProduct } from "./read-model";
import { isCategoryActiveNow } from "./read-model";
import { formatToman } from "@/domains/i18n/format";
import { toPersianDigits } from "@/domains/i18n/normalize";
import { sanitizeNote } from "@/lib/utils";
import { Search, X, Plus, Minus, Info, MapPin, CircleCheck } from "lucide-react";
import { ensureTextContrast, readableOn } from "@/lib/color-contrast";

type MenuLocale = "fa" | "en";

export function MenuThemeStyle({ theme }: { theme: MenuReadModel["theme"] }) {
  if (!theme) return null;
  const t = theme as unknown as Record<string, string>;
  const muted = ensureTextContrast(t.muted, [t.bg, t.card], t.fg);
  const accentText = ensureTextContrast(t.accent, [t.bg, t.card], t.fg);
  const accentForeground = ensureTextContrast(t.accentFg ?? readableOn(t.accent), t.accent, readableOn(t.accent));
  const vars: Record<string, string> = {
    "--menu-bg": t.bg,
    "--menu-card": t.card,
    "--menu-fg": t.fg,
    "--menu-muted": muted,
    "--menu-line": t.line,
    "--menu-accent": t.accent,
    "--menu-accent-text": accentText,
    "--menu-accent-fg": accentForeground,
    "--menu-radius": t.radius ?? "12px",
  };
  return <style>{`:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";")}}`}</style>;
}

function useMenuT(locale: MenuLocale) {
  return useMemo(() => {
    const fa = {
      search: "جستجوی غذا، نوشیدنی…",
      noResults: "چیزی پیدا نشد",
      noResultsHint: "نام دیگری را امتحان کنید.",
      soldOut: "ناموجود",
      featured: "پیشنهاد ویژه",
      bestseller: "پرفروش",
      new: "جدید",
      spicy: "تند",
      vegetarian: "گیاهی",
      vegan: "وگان",
      glutenAware: "بدون گلوتن",
      nutrition: "اطلاعات تغذیه‌ای",
      kcal: "کالری",
      protein: "پروتئین",
      carbs: "کربوهیدرات",
      fat: "چربی",
      allergens: "حساسیت‌زاها",
      customize: "شخصی‌سازی",
      addToCart: "افزودن به سبد",
      notePlaceholder: "مثلاً: بدون پیاز، پنیر اضافه، سس جداگانه",
      noteWarning: "درخواست‌های متنی درخواست هستند نه تعهد؛ پذیرش نهایی با رستوران است.",
      required: "الزامی",
      chooseUpTo: "حداکثر",
      poweredBy: "ساخته‌شده با",
      lastUpdated: "آخرین به‌روزرسانی",
      tableLabel: "میز",
      qty: "تعداد",
      item: "عدد",
      cart: "سبد سفارش",
      checkout: "ثبت سفارش",
      emptyCart: "سبد سفارش خالی است",
      name: "نام مشتری",
      phone: "شماره تماس",
      address: "آدرس تحویل",
      orderNote: "یادداشت سفارش",
      dineIn: "سرو در محل",
      takeaway: "بیرون‌بر",
      delivery: "ارسال",
      submitOrder: "ارسال سفارش به شعبه",
      orderSent: "سفارش با موفقیت برای شعبه ارسال شد",
      orderFailed: "ثبت سفارش انجام نشد؛ اطلاعات یا موجودی را بررسی کنید.",
      branchClosed: "این شعبه فعلاً سفارش آنلاین نمی‌پذیرد.",
    };
    const en = {
      search: "Search dishes, drinks…",
      noResults: "Nothing found",
      noResultsHint: "Try another term.",
      soldOut: "Sold out",
      featured: "Featured",
      bestseller: "Bestseller",
      new: "New",
      spicy: "Spicy",
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      glutenAware: "Gluten-aware",
      nutrition: "Nutrition",
      kcal: "Calories",
      protein: "Protein",
      carbs: "Carbs",
      fat: "Fat",
      allergens: "Allergens",
      customize: "Customize",
      addToCart: "Add to cart",
      notePlaceholder: "e.g. no onions, extra cheese, sauce on the side",
      noteWarning: "Free-text requests are requests, not guarantees — final acceptance is up to the restaurant.",
      required: "Required",
      chooseUpTo: "Up to",
      poweredBy: "Powered by",
      lastUpdated: "Last updated",
      tableLabel: "Table",
      qty: "Qty",
      item: "",
      cart: "Cart",
      checkout: "Checkout",
      emptyCart: "Your cart is empty",
      name: "Customer name",
      phone: "Contact number",
      address: "Delivery address",
      orderNote: "Order note",
      dineIn: "Dine-in",
      takeaway: "Pickup",
      delivery: "Delivery",
      submitOrder: "Send order to branch",
      orderSent: "Your order was sent to the branch",
      orderFailed: "Could not place the order. Check the details or availability.",
      branchClosed: "This branch is not accepting online orders right now.",
    };
    return locale === "fa" ? fa : en;
  }, [locale]);
}

const BADGE_LABEL: Record<string, Record<MenuLocale, string>> = {
  bestseller: { fa: "پرفروش", en: "Bestseller" },
  new: { fa: "جدید", en: "New" },
  spicy: { fa: "تند", en: "Spicy" },
  vegetarian: { fa: "گیاهی", en: "Veg" },
  vegan: { fa: "وگان", en: "Vegan" },
  chef: { fa: "پیشنهاد سرآشپز", en: "Chef's pick" },
};

interface MenuCartItem {
  key: string;
  product: ReadModelProduct;
  quantity: number;
  selections: Record<string, string[]>;
  note: string;
}

export function MenuApp({
  model,
  initialLocale,
  tableNumber,
  tableToken,
  branchContext,
}: {
  model: MenuReadModel;
  initialLocale: MenuLocale;
  tableNumber?: string | null;
  tableToken?: string | null;
  branchContext?: { selectedBranchId: string | null; options: { id: string; name: string; address: string | null; phone: string | null; url: string; acceptsOrders: boolean; fulfillmentTypes: string[]; minimumOrder: number }[] };
}) {
  const [locale, setLocale] = useState<MenuLocale>(initialLocale);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [sheetProduct, setSheetProduct] = useState<ReadModelProduct | null>(null);
  const [cart, setCart] = useState<MenuCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const t = useMenuT(locale);
  const selectedBranch = branchContext?.options.find((branch) => branch.id === branchContext.selectedBranchId) ?? null;
  const orderingEnabled = model.capabilities?.ordering === true && (!selectedBranch || selectedBranch.acceptsOrders);

  function addToCart(product: ReadModelProduct, quantity: number, selections: Record<string, string[]>, note: string) {
    const key = `${product.id}:${JSON.stringify(selections)}:${note}`;
    setCart((current) => {
      const found = current.find((item) => item.key === key);
      return found
        ? current.map((item) => item.key === key ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item)
        : [...current, { key, product, quantity, selections, note }];
    });
    setSheetProduct(null);
  }

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    const url = new URL(window.location.href);
    url.searchParams.set("lang", locale);
    window.history.replaceState(window.history.state, "", url);
  }, [locale]);

  const isFa = locale === "fa";
  const fmt = (n: number) => formatToman(n, locale);
  const nd = (n: number | string) => (isFa ? toPersianDigits(n) : String(n));

  const visibleCategories = useMemo(
    () =>
      model.categories
        .filter((c) => c.products.length > 0)
        .filter((c) => isCategoryActiveNow(c, new Date(), model.business.timezone)),
    [model],
  );

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const norm = (s: string) =>
      s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\s+/g, " ").trim().toLowerCase();
    const q = norm(query);
    const out: { cat: string; product: ReadModelProduct }[] = [];
    for (const c of model.categories) {
      for (const p of c.products) {
        const hay = norm(
          [p.name, p.nameEn, p.description, p.descriptionEn, c.name, c.nameEn].filter(Boolean).join(" "),
        );
        if (hay.includes(q)) out.push({ cat: isFa ? c.name : c.nameEn ?? c.name, product: p });
      }
    }
    return out;
  }, [query, model, isFa]);

  return (
    <div className="menu-canvas min-h-dvh" style={{ background: "var(--menu-bg)", color: "var(--menu-fg)" }}>
      <MenuThemeStyle theme={model.theme} />

      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur border-b"
        style={{
          background: "color-mix(in srgb, var(--menu-bg) 82%, transparent)",
          borderColor: "var(--menu-line)",
        }}
      >
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold" style={{ color: "var(--menu-fg)" }}>
              {isFa ? model.title : model.titleEn ?? model.title}
            </h1>
            {model.business.city ? (
              <p className="truncate text-xs" style={{ color: "var(--menu-muted)" }}>
                {model.business.city}
              </p>
            ) : null}
          </div>
          {tableNumber ? (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: "var(--menu-accent)", color: "var(--menu-accent-fg)" }}
            >
              {t.tableLabel} {nd(tableNumber)}
            </span>
          ) : null}
          {branchContext && branchContext.options.length > 1 ? (
            <label className="relative max-w-44">
              <span className="sr-only">{isFa ? "انتخاب شعبه" : "Choose branch"}</span>
              <MapPin className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2" style={{ color: "var(--menu-muted)" }} aria-hidden="true" />
              <select value={branchContext.selectedBranchId ?? ""} onChange={(event) => { const option = branchContext.options.find((branch) => branch.id === event.target.value); if (option) { const next = new URL(option.url, window.location.origin); next.searchParams.set("lang", locale); window.location.href = next.toString(); } }} className="h-9 max-w-44 appearance-none truncate rounded-full border bg-transparent pe-7 ps-7 text-xs font-bold outline-none" style={{ borderColor: "var(--menu-line)", color: "var(--menu-fg)" }}>
                {branchContext.options.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </label>
          ) : null}
          {model.locales.includes("en") && model.locales.includes("fa") ? (
            <button
              type="button"
              onClick={() => setLocale(isFa ? "en" : "fa")}
              className="rounded-full border px-3 py-1.5 text-xs font-bold"
              style={{ borderColor: "var(--menu-line)", color: "var(--menu-fg)" }}
            >
              {isFa ? "EN" : "فا"}
            </button>
          ) : null}
        </div>
        {/* Search */}
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div
            className="flex items-center gap-2 rounded-xl px-3"
            style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)" }}
          >
            <Search className="size-4 shrink-0" style={{ color: "var(--menu-muted)" }} aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="h-10 w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--menu-fg)" }}
              aria-label={t.search}
            />
            {query ? (
              <button onClick={() => setQuery("")} aria-label="clear">
                <X className="size-4" style={{ color: "var(--menu-muted)" }} />
              </button>
            ) : null}
          </div>
        </div>
        {/* Category chips */}
        <nav className="mx-auto max-w-2xl px-4 pb-2 overflow-x-auto" aria-label="categories">
          <div className="flex gap-2">
            {visibleCategories.map((c) => {
              const name = isFa ? c.name : c.nameEn ?? c.name;
              return (
                <a
                  key={c.id}
                  href={`#cat-${c.slug}`}
                  onClick={() => setActiveCat(c.slug)}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-transform active:scale-95"
                  style={{
                    background: activeCat === c.slug ? "var(--menu-accent)" : "var(--menu-card)",
                    color: activeCat === c.slug ? "var(--menu-accent-fg)" : "var(--menu-fg)",
                    border: "1px solid var(--menu-line)",
                  }}
                >
                  {name}
                </a>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-2xl px-4 pb-32 pt-4">
        {searchResults ? (
          <section aria-live="polite">
            <h2 className="mb-3 text-sm font-bold" style={{ color: "var(--menu-muted)" }}>
              {searchResults.length === 0 ? t.noResults : `${nd(searchResults.length)} ${locale === "fa" ? "نتیجه" : "results"}`}
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--menu-muted)" }}>{t.noResultsHint}</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map(({ product }, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    fmt={fmt}
                    t={t}
                    eager={index === 0}
                    onOpen={() => setSheetProduct(product)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          visibleCategories.map((c, categoryIndex) => (
            <section key={c.id} id={`cat-${c.slug}`} className="scroll-mt-40 pb-8">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="text-xl font-extrabold" style={{ color: "var(--menu-fg)" }}>
                  {isFa ? c.name : c.nameEn ?? c.name}
                </h2>
                <span className="text-xs" style={{ color: "var(--menu-muted)" }}>
                  {nd(c.products.length)}
                </span>
              </div>
              <div className="space-y-2">
                {c.products.map((p, productIndex) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    locale={locale}
                    fmt={fmt}
                    t={t}
                    eager={categoryIndex === 0 && productIndex === 0}
                    onOpen={() => setSheetProduct(p)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Product sheet */}
      {sheetProduct ? (
        <ProductSheet
          product={sheetProduct}
          locale={locale}
          fmt={fmt}
          nd={nd}
          t={t}
          orderingEnabled={orderingEnabled}
          onAdd={(quantity, selections, note) => addToCart(sheetProduct, quantity, selections, note)}
          onClose={() => setSheetProduct(null)}
        />
      ) : null}

      {model.capabilities?.ordering === true && selectedBranch && !selectedBranch.acceptsOrders ? <div className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-md rounded-2xl bg-neutral-900 px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">{t.branchClosed}</div> : null}
      {orderingEnabled && cart.length ? <button type="button" onClick={() => setCartOpen(true)} className="fixed inset-x-4 bottom-4 z-30 mx-auto flex h-14 max-w-md items-center justify-between rounded-2xl px-5 text-sm font-extrabold shadow-2xl transition-transform hover:-translate-y-1 active:scale-[0.98]" style={{ background: "var(--menu-accent)", color: "var(--menu-accent-fg)" }}><span>{t.cart} · {nd(cart.reduce((sum, item) => sum + item.quantity, 0))}</span><span>{fmt(cart.reduce((sum, item) => sum + cartItemTotal(item), 0))}</span></button> : null}
      {cartOpen ? <CartSheet items={cart} locale={locale} t={t} fmt={fmt} branch={selectedBranch} menuId={model.menuId} tableToken={tableToken ?? ""} onItemsChange={setCart} onClose={() => setCartOpen(false)} /> : null}

      {/* Footer */}
      <footer className="border-t py-6 text-center" style={{ borderColor: "var(--menu-line)" }}>
        <p className="text-xs" style={{ color: "var(--menu-muted)" }}>
          {t.lastUpdated}: {nd(new Date(model.builtAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US"))}
          {" · "}
          {t.poweredBy}{" "}
          <Link href="/" className="font-bold" style={{ color: "var(--menu-accent-text)" }}>
            Foryxo Menu
          </Link>
        </p>
      </footer>
    </div>
  );
}

function ProductCard({
  product,
  locale,
  fmt,
  t,
  eager = false,
  onOpen,
}: {
  product: ReadModelProduct;
  locale: MenuLocale;
  fmt: (n: number) => string;
  t: ReturnType<typeof useMenuT>;
  eager?: boolean;
  onOpen: () => void;
}) {
  const isFa = locale === "fa";
  const name = isFa ? product.name : product.nameEn ?? product.name;
  const desc = isFa ? product.description : product.descriptionEn ?? product.description;
  const soldOut = product.soldOut || !product.available;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-stretch gap-3 rounded-2xl p-3 text-start transition-transform active:scale-[0.99]"
      style={{
        background: "var(--menu-card)",
        border: "1px solid var(--menu-line)",
        borderRadius: "var(--menu-radius)",
        opacity: soldOut ? 0.55 : 1,
      }}
      aria-disabled={soldOut}
    >
      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="font-bold" style={{ color: "var(--menu-fg)" }}>{name}</h3>
          {product.featured ? (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--menu-accent)", color: "var(--menu-accent-fg)" }}>
              {t.featured}
            </span>
          ) : null}
          {product.badges.slice(0, 2).map((b) =>
            BADGE_LABEL[b] ? (
              <span
                key={b}
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ border: "1px solid var(--menu-accent)", color: "var(--menu-accent-text)" }}
              >
                {BADGE_LABEL[b][locale]}
              </span>
            ) : null,
          )}
          {soldOut ? (
            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-white">
              {t.soldOut}
            </span>
          ) : null}
        </div>
        {desc ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-5" style={{ color: "var(--menu-muted)" }}>
            {desc}
          </p>
        ) : null}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-extrabold" style={{ color: "var(--menu-accent-text)" }}>
            {fmt(product.price)}
          </span>
          {product.priceOld ? (
            <span className="text-xs line-through" style={{ color: "var(--menu-muted)" }}>
              {fmt(product.priceOld)}
            </span>
          ) : null}
        </div>
      </div>
      {/* Product image */}
      <div
        className="relative size-20 shrink-0 overflow-hidden rounded-xl"
        style={{ background: "var(--menu-line)" }}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="80px"
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--menu-line)" }} aria-hidden="true" />
        )}
      </div>
    </button>
  );
}

function ProductSheet({
  product,
  locale,
  fmt,
  nd,
  t,
  orderingEnabled,
  onAdd,
  onClose,
}: {
  product: ReadModelProduct;
  locale: MenuLocale;
  fmt: (n: number) => string;
  nd: (n: number | string) => string;
  t: ReturnType<typeof useMenuT>;
  orderingEnabled: boolean;
  onAdd: (quantity: number, selections: Record<string, string[]>, note: string) => void;
  onClose: () => void;
}) {
  const isFa = locale === "fa";
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of product.modifierGroups) {
      init[g.id] = g.options.filter((o) => o.isDefault && o.available).map((o) => o.id);
    }
    return init;
  });
  const [added, setAdded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const delta = product.modifierGroups.reduce((sum, g) => {
    return (
      sum +
      (selections[g.id] ?? []).reduce((s, optId) => {
        const opt = g.options.find((o) => o.id === optId);
        return s + (opt?.priceDelta ?? 0);
      }, 0)
    );
  }, 0);
  const unitPrice = product.price + delta;
  const missingRequired = product.modifierGroups.some(
    (g) => g.required && (selections[g.id]?.length ?? 0) < Math.max(1, g.min),
  );

  const toggleOption = (groupId: string, optId: string, max: number, allowRepeat: boolean) => {
    setSelections((prev) => {
      const cur = prev[groupId] ?? [];
      if (cur.includes(optId)) {
        return { ...prev, [groupId]: cur.filter((i) => i !== optId) };
      }
      if (cur.length >= max && !allowRepeat) {
        return { ...prev, [groupId]: [...cur.slice(1), optId] };
      }
      return { ...prev, [groupId]: [...cur, optId] };
    });
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={isFa ? product.name : product.nameEn ?? product.name}>
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl overflow-y-auto rounded-t-3xl pb-8"
        style={{ background: "var(--menu-bg)", maxHeight: "88dvh" }}
      >
        {/* Product image */}
        <div className="relative h-52" style={{ background: "var(--menu-line)" }}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={isFa ? product.name : product.nameEn ?? product.name}
              fill
              priority
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-cover"
            />
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="absolute end-3 top-3 grid size-11 place-items-center rounded-full shadow-lg"
            style={{ background: "var(--menu-card)" }}
            aria-label={isFa ? "بستن" : "Close"}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--menu-fg)" }}>
            {isFa ? product.name : product.nameEn ?? product.name}
          </h2>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--menu-muted)" }}>
            {isFa ? product.description : product.descriptionEn ?? product.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-extrabold" style={{ color: "var(--menu-accent)" }}>
              {fmt(unitPrice)}
            </span>
            {product.priceOld ? (
              <span className="text-sm line-through" style={{ color: "var(--menu-muted)" }}>
                {fmt(product.priceOld)}
              </span>
            ) : null}
          </div>

          {/* Nutrition */}
          {product.nutrition ? (
            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase" style={{ color: "var(--menu-muted)" }}>{t.nutrition}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  [t.kcal, product.nutrition.kcal],
                  [t.protein, product.nutrition.protein],
                  [t.carbs, product.nutrition.carbs],
                  [t.fat, product.nutrition.fat],
                ].map(([label, v]) => (
                  <span
                    key={label as string}
                    className="rounded-lg px-2.5 py-1 text-xs font-bold"
                    style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)" }}
                  >
                    {label}: {nd(v as number)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Allergens */}
          {product.allergens.length > 0 ? (
            <p className="mt-3 text-xs" style={{ color: "var(--menu-muted)" }}>
              {t.allergens}: {product.allergens.join(" · ")}
            </p>
          ) : null}

          {/* Modifier groups */}
          {product.modifierGroups.map((g) => {
            const gName = isFa ? g.name : g.nameEn ?? g.name;
            return (
              <fieldset key={g.id} className="mt-5">
                <legend className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--menu-fg)" }}>
                  {gName}
                  {g.required ? (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--menu-accent)", color: "var(--menu-bg)" }}>
                      {t.required}
                    </span>
                  ) : (
                    <span className="text-[10px]" style={{ color: "var(--menu-muted)" }}>
                      {t.chooseUpTo} {nd(g.max)}
                    </span>
                  )}
                </legend>
                <div className="grid gap-2">
                  {g.options.map((o) => {
                    const selected = (selections[g.id] ?? []).includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        disabled={!o.available}
                        onClick={() => toggleOption(g.id, o.id, g.max, g.allowRepeat)}
                        className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40"
                        style={{
                          background: selected ? "var(--menu-accent)" : "var(--menu-card)",
                          color: selected ? "var(--menu-bg)" : "var(--menu-fg)",
                          border: `1px solid ${selected ? "var(--menu-accent)" : "var(--menu-line)"}`,
                        }}
                        aria-pressed={selected}
                      >
                        <span>{isFa ? o.name : o.nameEn ?? o.name}</span>
                        {o.priceDelta !== 0 ? (
                          <span className="text-xs">
                            {o.priceDelta > 0 ? "+" : ""}
                            {fmt(o.priceDelta)}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {/* Custom request note (spec §20 District) */}
          {product.allowsCustomRequest ? (
            <div className="mt-5">
              <label className="text-sm font-bold" style={{ color: "var(--menu-fg)" }} htmlFor="custom-note">
                {t.customize}
              </label>
              <textarea
                id="custom-note"
                value={note}
                onChange={(e) => setNote(sanitizeNote(e.target.value))}
                maxLength={200}
                rows={2}
                placeholder={t.notePlaceholder}
                className="mt-2 w-full rounded-xl p-3 text-sm outline-none"
                style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)", color: "var(--menu-fg)" }}
              />
              <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--menu-muted)" }}>
                <Info className="size-3" aria-hidden="true" />
                {t.noteWarning} · {nd(200 - note.length)}
              </div>
            </div>
          ) : null}

          {/* Quantity + add — shown only for menus with real ordering enabled. */}
          {orderingEnabled ? <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)" }}>
              <button type="button" className="p-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="decrease">
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-bold">{nd(qty)}</span>
              <button type="button" className="p-2" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="increase">
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              disabled={missingRequired || product.soldOut}
              onClick={() => {
                setAdded(true);
                onAdd(qty, selections, note);
                setTimeout(() => setAdded(false), 1600);
              }}
              className="h-12 flex-1 rounded-xl text-sm font-extrabold disabled:opacity-50"
              style={{ background: "var(--menu-accent)", color: "var(--menu-bg)" }}
            >
              {added
                ? locale === "fa" ? "به سبد اضافه شد ✓" : "Added ✓"
                : `${t.addToCart} · ${fmt(unitPrice * qty)}`}
            </button>
          </div> : null}
        </div>
      </div>
    </div>
  );
}

function cartItemTotal(item: MenuCartItem) {
  const delta = item.product.modifierGroups.reduce((sum, group) => sum + (item.selections[group.id] ?? []).reduce((groupSum, id) => groupSum + (group.options.find((option) => option.id === id)?.priceDelta ?? 0), 0), 0);
  return (item.product.price + delta) * item.quantity;
}

function CartSheet({ items, locale, t, fmt, branch, menuId, tableToken, onItemsChange, onClose }: {
  items: MenuCartItem[];
  locale: MenuLocale;
  t: ReturnType<typeof useMenuT>;
  fmt: (value: number) => string;
  branch: { id: string; name: string; address: string | null; phone: string | null; url: string; acceptsOrders: boolean; fulfillmentTypes: string[]; minimumOrder: number } | null;
  menuId: string;
  tableToken: string;
  onItemsChange: (items: MenuCartItem[]) => void;
  onClose: () => void;
}) {
  const fa = locale === "fa";
  const methods = (branch?.fulfillmentTypes.length ? branch.fulfillmentTypes : ["dine_in", "takeaway"]).filter((method) => ["dine_in", "takeaway", "delivery"].includes(method));
  const [orderType, setOrderType] = useState(methods[0] ?? "takeaway");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [confirmation, setConfirmation] = useState<{ number: string; trackingUrl: string; total: number } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const total = items.reduce((sum, item) => sum + cartItemTotal(item), 0);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]'));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keydown); previousFocus?.focus(); };
  }, [onClose]);

  async function submit() {
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 7 || (orderType === "delivery" && !address.trim())) { setError(t.orderFailed); return; }
    setBusy(true); setError(null);
    const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ menuId, idempotencyKey, branchId: branch?.id ?? null, tableToken, orderType, customerName: name, customerPhone: phone, customerAddress: address, note, items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity, selections: item.selections, note: item.note })) }) }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok) { setConfirmation({ number: data.number, trackingUrl: data.trackingUrl, total: data.total }); onItemsChange([]); }
    else {
      const code = data?.error;
      const messages: Record<string, string> = fa ? { rate_limited: "درخواست‌های زیادی ارسال شده؛ چند دقیقه دیگر تلاش کنید.", cart_changed: "منو یا قیمت‌ها تغییر کرده است؛ سبد را دوباره بررسی کنید.", minimum_order: "مبلغ سفارش از حداقل این شعبه کمتر است.", branch_not_accepting_orders: "این شعبه فعلاً سفارش نمی‌پذیرد.", fulfillment_unavailable: "روش تحویل انتخابی برای این شعبه فعال نیست.", invalid_table: "QR میز برای این شعبه معتبر نیست؛ QR همان میز را دوباره اسکن کنید.", ordering_unavailable: "سفارش آنلاین این منو فعلاً غیرفعال است." } : { rate_limited: "Too many requests; please try again in a few minutes.", cart_changed: "The menu or prices changed; please review your cart.", minimum_order: "This order is below the branch minimum.", branch_not_accepting_orders: "This branch is not accepting orders right now.", fulfillment_unavailable: "That fulfillment method is unavailable at this branch.", invalid_table: "This table QR is not valid for the selected branch. Scan the table QR again.", ordering_unavailable: "Online ordering is currently unavailable for this menu." };
      setError(messages[code] ?? t.orderFailed);
    }
    setBusy(false);
  }

  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t.cart}>
    <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
    <div ref={dialogRef} tabIndex={-1} className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-2xl overflow-y-auto rounded-t-3xl p-5 pb-8 outline-none" style={{ background: "var(--menu-bg)", color: "var(--menu-fg)" }}>
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">{t.cart}</h2>{branch ? <p className="mt-1 text-xs" style={{ color: "var(--menu-muted)" }}>{branch.name}{branch.address ? ` · ${branch.address}` : ""}</p> : null}</div><button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full" style={{ background: "var(--menu-card)" }} aria-label={fa ? "بستن" : "Close"}><X className="size-4" /></button></div>
      {confirmation ? <div className="mt-8 rounded-2xl p-6 text-center" style={{ background: "var(--menu-card)", border: "1px solid var(--menu-accent)" }}><CircleCheck className="mx-auto size-10" style={{ color: "var(--menu-accent-text)" }} /><p className="mt-3 font-extrabold">{t.orderSent}</p><p className="mt-2 text-sm" dir="ltr">{confirmation.number}</p><div className="mt-4 rounded-xl p-3 text-xs" style={{ background: "var(--menu-bg)", color: "var(--menu-muted)" }}><p>{branch?.name} · {orderType === "dine_in" ? t.dineIn : orderType === "delivery" ? t.delivery : t.takeaway}</p><p className="mt-1 font-bold" style={{ color: "var(--menu-fg)" }}>{fa ? "پرداخت در شعبه: " : "Pay at the branch: "}{fmt(confirmation.total)}</p></div><p className="mt-3 text-xs" style={{ color: "var(--menu-muted)" }}>{fa ? "شعبه وضعیت سفارش را بررسی می‌کند. برای هماهنگی ممکن است با شما تماس بگیرد." : "The branch will confirm the order and may contact you if coordination is needed."}</p><a href={`${confirmation.trackingUrl}?lang=${locale}`} className="mt-5 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold" style={{ background: "var(--menu-accent)", color: "var(--menu-accent-fg)" }}>{fa ? "پیگیری زنده سفارش" : "Track order live"}</a><button type="button" onClick={onClose} className="mt-3 h-11 w-full rounded-xl px-6 text-sm font-bold" style={{ border: "1px solid var(--menu-line)" }}>{fa ? "بستن" : "Close"}</button></div> : <>
        <ul className="mt-5 space-y-2">{items.map((item) => <li key={item.key} className="rounded-2xl p-3" style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)" }}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{fa ? item.product.name : item.product.nameEn ?? item.product.name}</p><p className="mt-1 text-xs" style={{ color: "var(--menu-muted)" }}>{item.product.modifierGroups.flatMap((group) => (item.selections[group.id] ?? []).map((id) => group.options.find((option) => option.id === id)?.[fa ? "name" : "nameEn"] ?? "")).filter(Boolean).join(" · ")}</p></div><button type="button" onClick={() => onItemsChange(items.filter((entry) => entry.key !== item.key))} className="grid size-9 place-items-center rounded-lg" aria-label={fa ? "حذف" : "Remove"}><X className="size-4" /></button></div><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-1 rounded-lg" style={{ border: "1px solid var(--menu-line)" }}><button type="button" aria-label={fa ? "کم کردن تعداد" : "Decrease quantity"} className="p-2" onClick={() => onItemsChange(items.map((entry) => entry.key === item.key ? { ...entry, quantity: Math.max(1, entry.quantity - 1) } : entry))}><Minus className="size-3" /></button><span className="min-w-6 text-center text-sm font-bold">{item.quantity}</span><button type="button" aria-label={fa ? "زیاد کردن تعداد" : "Increase quantity"} className="p-2" onClick={() => onItemsChange(items.map((entry) => entry.key === item.key ? { ...entry, quantity: Math.min(99, entry.quantity + 1) } : entry))}><Plus className="size-3" /></button></div><span className="text-sm font-extrabold">{fmt(cartItemTotal(item))}</span></div></li>)}</ul>
        <fieldset className="mt-5"><legend className="text-sm font-bold">{fa ? "روش دریافت" : "Fulfillment"}</legend><div className="mt-2 grid grid-cols-3 gap-2">{methods.map((method) => <button key={method} type="button" aria-pressed={orderType === method} onClick={() => setOrderType(method)} className="rounded-xl border px-2 py-2.5 text-xs font-bold" style={{ background: orderType === method ? "var(--menu-accent)" : "var(--menu-card)", color: orderType === method ? "var(--menu-accent-fg)" : "var(--menu-fg)", borderColor: "var(--menu-line)" }}>{method === "dine_in" ? t.dineIn : method === "takeaway" ? t.takeaway : t.delivery}</button>)}</div></fieldset>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">{t.name} *<input value={name} onChange={(event) => setName(sanitizeNote(event.target.value))} maxLength={80} className="mt-1 h-11 w-full rounded-xl px-3 outline-none" style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)", color: "var(--menu-fg)" }} /></label><label className="text-xs font-bold">{t.phone} *<input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d+\-() ]/g, ""))} maxLength={30} inputMode="tel" dir="ltr" className="mt-1 h-11 w-full rounded-xl px-3 outline-none" style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)", color: "var(--menu-fg)" }} /></label>{orderType === "delivery" ? <label className="text-xs font-bold sm:col-span-2">{t.address} *<textarea value={address} onChange={(event) => setAddress(sanitizeNote(event.target.value, 500))} rows={2} maxLength={500} className="mt-1 w-full rounded-xl p-3 outline-none" style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)", color: "var(--menu-fg)" }} /></label> : null}<label className="text-xs font-bold sm:col-span-2">{t.orderNote}<textarea value={note} onChange={(event) => setNote(sanitizeNote(event.target.value, 500))} rows={2} maxLength={500} className="mt-1 w-full rounded-xl p-3 outline-none" style={{ background: "var(--menu-card)", border: "1px solid var(--menu-line)", color: "var(--menu-fg)" }} /></label></div>
        <p className="mt-3 text-[11px] leading-5" style={{ color: "var(--menu-muted)" }}>{fa ? "شماره تماس فقط برای تأیید و هماهنگی همین سفارش در اختیار شعبه انتخابی قرار می‌گیرد." : "Your phone number is shared only with the selected branch to confirm and coordinate this order."}</p>
        <p className="mt-1 text-[11px] leading-5" style={{ color: "var(--menu-muted)" }}>{fa ? "این سفارش اکنون پرداخت آنلاین ندارد؛ مبلغ نمایش‌داده‌شده در شعبه یا هنگام تحویل پرداخت می‌شود." : "Online payment is not enabled for this order; pay the displayed amount at the branch or on delivery."}</p>
        {branch?.minimumOrder && total < branch.minimumOrder ? <p className="mt-3 text-xs font-bold text-red-500">{fa ? `حداقل سفارش این شعبه ${fmt(branch.minimumOrder)} است.` : `This branch has a ${fmt(branch.minimumOrder)} minimum order.`}</p> : null}{error ? <p className="mt-3 text-sm font-bold text-red-500" role="alert">{error}</p> : null}
        <div className="mt-5 flex items-center justify-between text-lg font-black"><span>{fa ? "جمع سفارش" : "Order total"}</span><span>{fmt(total)}</span></div><button type="button" onClick={() => void submit()} disabled={busy || !items.length || Boolean(branch?.minimumOrder && total < branch.minimumOrder)} className="mt-4 h-13 w-full rounded-2xl text-sm font-extrabold disabled:opacity-50" style={{ background: "var(--menu-accent)", color: "var(--menu-accent-fg)" }}>{busy ? (fa ? "در حال ارسال…" : "Sending…") : t.submitOrder}</button>
      </>}
    </div>
  </div>;
}
