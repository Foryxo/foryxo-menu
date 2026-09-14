/** Backward-compatible HTTP redirect from the former public menu URL. */
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = new URL(request.url);
  destination.pathname = `/menus/${slug}/menu`;
  return NextResponse.redirect(destination, 308);
}
