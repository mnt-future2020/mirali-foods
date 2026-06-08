import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listCouriersForOrder } from "@/lib/shiprocket";

// GET /api/admin/orders/[id]/shiprocket/couriers
// Returns the serviceable couriers for a pushed order (for manual selection).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const result = await listCouriersForOrder(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: result.httpStatus || 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      couriers: result.couriers,
      context: result.context,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load couriers" },
      { status: 500 },
    );
  }
}
