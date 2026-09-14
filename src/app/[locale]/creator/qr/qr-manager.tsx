"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  Field,
  Input,
  Select,
  Badge,
  EmptyState,
} from "@/components/ui/primitives";
import type { Locale } from "@/domains/i18n/config";

interface MenuOption {
  id: string;
  slug: string;
  title: string;
  businessId: string;
  branchId: string | null;
  businessName: string;
  status: string;
}
interface BranchOption { id: string; businessId: string; name: string; isPrimary: boolean; isActive: boolean }
interface Code {
  id: string;
  sourceId: string;
  tableLabel: string | null;
  branchId: string | null;
  branchName: string | null;
  targetUrl: string;
  scanCount: number;
}

export function QrManager({
  locale,
  menus,
  branches,
}: {
  locale: Locale;
  menus: MenuOption[];
  branches: BranchOption[];
}) {
  const fa = locale === "fa";
  const [menuId, setMenuId] = useState(
    menus.find((menu) => menu.status === "published")?.id ?? menus[0]?.id ?? "",
  );
  const [tableCount, setTableCount] = useState(0);
  const [tableQrAllowance, setTableQrAllowance] = useState(0);
  const [branchId, setBranchId] = useState("");
  const [codes, setCodes] = useState<Code[]>([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const selected = useMemo(
    () => menus.find((menu) => menu.id === menuId),
    [menuId, menus],
  );
  const availableBranches = useMemo(() => branches.filter((branch) => branch.businessId === selected?.businessId && branch.isActive), [branches, selected?.businessId]);
  const selectedBranchIsAvailable = availableBranches.some((branch) => branch.id === branchId);
  const effectiveBranchId = selected?.branchId ?? (selectedBranchIsAvailable ? branchId : availableBranches.find((branch) => branch.isPrimary)?.id ?? availableBranches[0]?.id ?? "");

  const load = useCallback(async (id: string, selectedBranchId: string) => {
    if (!id) return;
    try {
      const response = await fetch(
        `/api/creator/qr?menuId=${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      setCodes(response.ok ? data.codes : []);
      setTableQrAllowance(response.ok ? data.tableQrAllowance ?? 0 : 0);
      setTableCount(response.ok ? data.codes.filter((code: Code) => code.tableLabel !== null && code.branchId === selectedBranchId).length : 0);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load(menuId, effectiveBranchId);
  }, [effectiveBranchId, load, menuId]);

  async function generate() {
    if (!menuId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/creator/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, branchId: effectiveBranchId || null, tableCount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "qr_generation_failed");
      setCodes(data.codes);
      setMessage(
        fa
          ? "کدهای دائمی آماده‌اند. کدهای قبلی بدون تغییر باقی ماندند."
          : "Permanent codes are ready. Existing codes were kept unchanged.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === "table_qr_quote_or_payment_required"
          ? (fa ? "تعداد QR میزها از تعداد تأیید و تسویه‌شده بیشتر است؛ ابتدا برای افزایش تعداد، استعلام جدید بفرستید." : "Table QR quantity exceeds the approved, funded order. Send a new quote for more codes first.")
          : (fa ? "ساخت QR انجام نشد؛ دوباره تلاش کنید." : "QR generation failed. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (menus.length === 0) {
    return (
      <EmptyState
        icon={<QrCode className="size-8" />}
        title={fa ? "هنوز منویی ساخته نشده است" : "No menus exist yet"}
        body={
          fa
            ? "پس از ساخت منو، QR دائمی آن از اینجا تحویل می‌شود."
            : "Once a menu exists, its permanent QR codes are delivered here."
        }
      />
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold accent-text">
          {fa ? "تحویل فایل آماده چاپ" : "Print-ready delivery"}
        </p>
        <h1 className="display-3 mt-1">
          {fa ? "QR دائمی منو و میزها" : "Permanent menu & table QR codes"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          {fa
            ? "QR اصلی هر منو رایگان است. برای هر میز یک کد جدا بسازید؛ تغییر آدرس داخلی یا طراحی منو، کد چاپ‌شده را از کار نمی‌اندازد."
            : "Every menu includes one main QR. Generate a separate code per table; internal URL or menu-design changes will not break a printed code."}
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_200px_180px_auto] lg:items-end">
          <Field label={fa ? "منو" : "Menu"} htmlFor="qr-menu">
            <Select
              id="qr-menu"
              value={menuId}
              onChange={(event) => {
                setBusy(true);
                setBranchId("");
                setMenuId(event.target.value);
              }}
            >
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.businessName} — {menu.title} ({menu.status})
                </option>
              ))}
            </Select>
          </Field>
          <Field label={fa ? "شعبه میزها" : "Table branch"} htmlFor="qr-branch" hint={selected?.branchId ? (fa ? "این منو به همین شعبه متصل است." : "This menu is assigned to this branch.") : (fa ? "برای منوی مشترک، شعبه میزها را انتخاب کنید." : "Choose the branch for a shared menu's tables.")}>
            <Select id="qr-branch" value={effectiveBranchId} disabled={Boolean(selected?.branchId)} onChange={(event) => setBranchId(event.target.value)}>
              {availableBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </Select>
          </Field>
          <Field
            label={fa ? "تعداد میز" : "Table count"}
            htmlFor="qr-count"
            hint={
              fa
                ? `از ۰ تا ۵۰۰؛ سقف QR میز پس از تأیید و تسویه سفارش: ${tableQrAllowance}؛ کد اصلی رایگان است.`
                : `0–500; approved and funded table QR allowance: ${tableQrAllowance}. The main QR is included.`
            }
          >
            <Input
              id="qr-count"
              type="number"
              min={0}
              max={500}
              inputMode="numeric"
              dir="ltr"
              value={tableCount}
              onChange={(event) =>
                setTableCount(
                  Math.max(0, Math.min(500, Number(event.target.value) || 0)),
                )
              }
            />
          </Field>
          <Button onClick={generate} loading={busy}>
            <RefreshCw />
            {fa ? "ساخت / تکمیل QRها" : "Create / complete codes"}
          </Button>
          {message ? (
            <p className="text-sm text-muted lg:col-span-3" role="status">
              {message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {selected ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-extrabold">{selected.businessName}</p>
          <Link
            href={`/menus/${selected.slug}/menu`}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm font-bold accent-text hover:underline"
          >
            {fa ? "بازکردن منوی نهایی" : "Open live menu"}
            <ExternalLink className="size-4" />
          </Link>
        </div>
      ) : null}

      {busy && codes.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {codes.map((code) => (
          <Card key={code.id} className="interactive-lift overflow-hidden">
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-extrabold">
                  {code.tableLabel === null
                    ? fa
                      ? "QR اصلی منو"
                      : "Main menu QR"
                    : fa
                      ? `میز ${code.tableLabel}${code.branchName ? ` · ${code.branchName}` : ""}`
                      : `Table ${code.tableLabel}${code.branchName ? ` · ${code.branchName}` : ""}`}
                </h2>
                {code.tableLabel === null ? (
                  <Badge>{fa ? "رایگان" : "Included"}</Badge>
                ) : null}
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white p-3">
                <Image
                  src={`/api/qr/${code.sourceId}`}
                  alt={
                    code.tableLabel === null
                      ? "Foryxo menu QR code"
                      : `Foryxo QR code for table ${code.tableLabel}`
                  }
                  width={1024}
                  height={1024}
                  unoptimized
                  className="h-auto w-full"
                />
              </div>
              <p
                className="mt-3 truncate text-xs text-muted"
                dir="ltr"
                title={code.targetUrl}
              >
                {code.targetUrl}
              </p>
              <p className="mt-1 text-xs text-muted">
                {fa ? `اسکن: ${code.scanCount}` : `Scans: ${code.scanCount}`}
              </p>
              <a
                href={`/api/qr/${code.sourceId}?download=1`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-bold hover:bg-subtle"
              >
                <Download className="size-4" />
                {fa ? "دانلود PNG باکیفیت" : "Download high-res PNG"}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
      {!busy && codes.length === 0 ? (
        <EmptyState
          icon={<QrCode className="size-8" />}
          title={fa ? "هنوز QR ساخته نشده" : "No QR codes yet"}
          body={
            fa
              ? "تعداد میز را وارد کنید و دکمه ساخت را بزنید."
              : "Enter the table count and create the codes."
          }
        />
      ) : null}
    </div>
  );
}
