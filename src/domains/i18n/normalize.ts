/**
 * Persian text normalization (spec §41).
 * Used for menu search haystacks and duplicate detection.
 */
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizePersian(input: string): string {
  let s = input;
  // Arabic Yeh/Kaf → Persian
  s = s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/ى/g, "ی");
  // Strip Arabic diacritics (tashkeel) & tatweel
  s = s.replace(/[\u064B-\u0652\u0670\u0640]/g, "");
  // Arabic/Persian digits → ASCII for consistent matching
  s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
  s = s.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
  // ZWNJ is meaningful in Persian; keep it, but normalize surrounding spaces
  s = s.replace(/ \u200c /g, "\u200c");
  // Collapse whitespace, lowercase latin
  s = s.replace(/\s+/g, " ").trim().toLowerCase();
  return s;
}

/** Convert ASCII digits to Persian digits for display (fa UI). */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Convert Persian/Arabic digits to ASCII (input normalization). */
export function toAsciiDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/** Normalize +98 Iranian mobile numbers to E.164. Returns null if invalid. */
export function normalizeIranPhone(raw: string): string | null {
  const digits = toAsciiDigits(raw).replace(/[\s\-()]/g, "");
  let normalized: string;
  if (digits.startsWith("+98")) normalized = digits;
  else if (digits.startsWith("0098")) normalized = `+${digits.slice(2)}`;
  else if (digits.startsWith("98") && digits.length === 12) normalized = `+${digits}`;
  else if (digits.startsWith("09") && digits.length === 11) normalized = `+98${digits.slice(1)}`;
  else if (digits.startsWith("9") && digits.length === 10) normalized = `+98${digits}`;
  else return null;
  return /^\+989\d{9}$/.test(normalized) ? normalized : null;
}

/** Normalize email (trim + lowercase). */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
