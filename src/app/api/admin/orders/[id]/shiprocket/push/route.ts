import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pushOrderToShiprocket } from "@/lib/shiprocket";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const result = await pushOrderToShiprocket(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: result.httpStatus || 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      srOrderId: result.srOrderId,
      shipmentId: result.shipmentId,
      awbCode: result.awbCode,
      courierName: result.courierName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Push failed" },
      { status: 500 },
    );
  }
}
