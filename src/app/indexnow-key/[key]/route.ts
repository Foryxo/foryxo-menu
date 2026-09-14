/**
 * IndexNow verification (spec §139). The key is set via INDEXNOW_KEY env.
 * When a search engine fetches /indexnow-key/{key}, we confirm it matches.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const configured = process.env.INDEXNOW_KEY ?? "";
  if (!configured || key !== configured) {
    return new Response("not found", { status: 404 });
  }
  return new Response(configured, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

export const dynamic = "force-dynamic";
