import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { assignAwbForOrder } from "@/lib/shiprocket";

// POST /api/admin/orders/[id]/shiprocket/assign
// Body: { courierId?: number } — assigns an AWB with the chosen courier
// (or Shiprocket's default if omitted) and schedules pickup.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { courierId?: number };
    const courierId = body?.courierId ? Number(body.courierId) : undefined;
    const result = await assignAwbForOrder(id, courierId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: result.httpStatus || 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      awbCode: result.awbCode,
      courierName: result.courierName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "AWB assignment failed" },
      { status: 500 },
    );
  }
}
