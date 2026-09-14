type Rgb = [number, number, number];

function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as Rgb;
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(rgb: Rgb): number {
  const channels = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) return 21;
  const [lighter, darker] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return from.map((channel, index) => channel + (to[index] - channel) * amount) as Rgb;
}

/** Keep a theme's character while nudging small text to WCAG AA contrast. */
export function ensureTextContrast(
  foreground: string,
  backgrounds: string | string[],
  fallback: string,
  minimum = 4.5,
): string {
  const surfaces = Array.isArray(backgrounds) ? backgrounds : [backgrounds];
  if (surfaces.every((background) => contrastRatio(foreground, background) >= minimum)) return foreground;
  const from = parseHex(foreground);
  const to = parseHex(fallback);
  if (!from || !to) return fallback;

  for (let step = 1; step <= 20; step += 1) {
    const candidate = toHex(mix(from, to, step / 20));
    if (surfaces.every((background) => contrastRatio(candidate, background) >= minimum)) return candidate;
  }
  return fallback;
}

export function readableOn(background: string): "#000000" | "#ffffff" {
  return contrastRatio("#000000", background) >= contrastRatio("#ffffff", background)
    ? "#000000"
    : "#ffffff";
}
