import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/domains/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json(
      { ok: true, service: "foryxo-menu", database: "reachable", latencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, service: "foryxo-menu", database: "unreachable", latencyMs: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
