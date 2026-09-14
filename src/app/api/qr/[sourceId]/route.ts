import QRCode from "qrcode";
import { findMenuQr } from "@/domains/qr/service";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await params;
  if (!/^[a-f0-9]{36}$/.test(sourceId) || !(await findMenuQr(sourceId))) {
    return new Response("QR code not found", { status: 404 });
  }
  const stableUrl = `https://menu.foryxo.com/q/${sourceId}`;
  const png = await QRCode.toBuffer(stableUrl, {
    type: "png",
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#0e1117", light: "#ffffff" },
  });
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(download ? { "Content-Disposition": `attachment; filename="foryxo-qr-${sourceId}.png"` } : {}),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
