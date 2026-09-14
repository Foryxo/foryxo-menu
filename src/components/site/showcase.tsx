"use client";

/**
 * Home hero showcase — touch-driven Swiper gallery of live demo previews.
 * Dynamically imported Swiper to keep initial JS small (spec §48).
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { DemoDefinition } from "@/content/demos/types";
import type { Locale } from "@/domains/i18n/config";
import { DemoPhone } from "./demo-phone";

export function DemoShowcase({
  demos,
  locale,
}: {
  demos: DemoDefinition[];
  locale: Locale;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<{ destroy: () => void; autoplay?: { start: () => void; stop: () => void } } | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let swiperInstance: { destroy: () => void } | null = null;
    (async () => {
      const [{ default: Swiper }, { A11y, Autoplay, Keyboard, Navigation, Pagination }] = await Promise.all([
        import("swiper"),
        import("swiper/modules"),
      ]);
      const core = await import("swiper/css");
      void core;
      if (cancelled || !containerRef.current) return;
      swiperInstance = new Swiper(containerRef.current, {
        modules: [A11y, Autoplay, Keyboard, Navigation, Pagination],
        slidesPerView: "auto",
        spaceBetween: 24,
        keyboard: { enabled: true },
        navigation: { nextEl: ".foryxo-swiper-next", prevEl: ".foryxo-swiper-prev" },
        pagination: { el: ".foryxo-swiper-pagination", clickable: true },
        autoplay: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? false
          : { delay: 4800, disableOnInteraction: false, pauseOnMouseEnter: true },
        loop: false,
        rewind: true,
        speed: 700,
      }) as unknown as { destroy: () => void };
      swiperRef.current = swiperInstance;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      swiperInstance?.destroy();
      swiperRef.current = null;
    };
  }, []);

  const fa = locale === "fa";

  return (
    <div className="hero-swiper relative min-w-0 select-none overflow-hidden py-4" dir="ltr" onDragStart={(event) => event.preventDefault()}>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg)] to-transparent" />
      <div ref={containerRef} className="swiper !overflow-visible">
        <div className="swiper-wrapper">
          {demos.map((d) => (
            <div key={d.id} className="swiper-slide !w-auto">
              <Link
                href={`/${locale}/demos/${d.id}`}
                className="block transition-transform duration-300 hover:scale-[1.03] focus-visible:scale-[1.03]"
                aria-label={d.name}
              >
                <DemoPhone demo={d} locale={locale} interactive={false} />
                <p className="mt-3 text-center text-sm font-bold">{fa ? d.nameFa : d.name}</p>
                <p className="text-center text-xs text-muted">{fa ? d.tagline.fa : d.tagline.en}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button type="button" className="foryxo-swiper-prev grid size-11 place-items-center rounded-full border border-line bg-elevated transition-transform hover:-translate-y-0.5" aria-label={fa ? "دموی قبلی" : "Previous demo"}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <div className="foryxo-swiper-pagination !static !w-auto" role="navigation" aria-label={fa ? "انتخاب دمو" : "Choose demo"} />
        <button
          type="button"
          onClick={() => {
            if (playing) swiperRef.current?.autoplay?.stop();
            else swiperRef.current?.autoplay?.start();
            setPlaying((value) => !value);
          }}
          className="grid size-11 place-items-center rounded-full border border-line bg-elevated transition-transform hover:-translate-y-0.5"
          aria-label={playing ? (fa ? "توقف پخش خودکار" : "Pause autoplay") : (fa ? "ادامه پخش خودکار" : "Resume autoplay")}
        >
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </button>
        <button type="button" className="foryxo-swiper-next grid size-11 place-items-center rounded-full border border-line bg-elevated transition-transform hover:-translate-y-0.5" aria-label={fa ? "دموی بعدی" : "Next demo"}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      {!ready ? <div className="skeleton mx-auto h-[430px] w-[240px]" aria-hidden="true" /> : null}
    </div>
  );
}
