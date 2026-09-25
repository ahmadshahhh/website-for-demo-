import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getOrderPulse } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/** Lightweight poll used by the admin panel to detect new orders. */
export async function GET() {
  if (!(await getCurrentAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getOrderPulse(), { headers: { "Cache-Control": "no-store" } });
}
