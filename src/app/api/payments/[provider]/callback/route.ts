import { NextResponse } from "next/server";
import { handleProviderCallback } from "@/lib/payments/service";

/**
 * Gateway return/webhook endpoint: /api/payments/<provider>/callback.
 * The provider adapter verifies the signature before anything is updated.
 */
async function handle(req: Request, provider: string) {
  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);
  if (req.method === "POST") {
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const [k, v] of form) if (typeof v === "string") params.set(k, v);
    } else if (type.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      for (const [k, v] of Object.entries(body)) if (typeof v === "string") params.set(k, v);
    }
  }
  const order = await handleProviderCallback(provider, params);
  if (!order) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.redirect(new URL(`/order/${order.trackingId}`, url.origin), 303);
}

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  return handle(req, (await params).provider);
}
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  return handle(req, (await params).provider);
}
