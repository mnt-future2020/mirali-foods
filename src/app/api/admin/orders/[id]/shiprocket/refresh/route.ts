import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { syncOrderTracking, ShiprocketError } from "@/lib/shiprocket";

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
    const tracking = await syncOrderTracking(id);
    if (!tracking) {
      return NextResponse.json(
        { error: "No Shiprocket shipment ID or AWB on this order" },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, tracking });
  } catch (error: any) {
    const httpStatus = error instanceof ShiprocketError ? error.httpStatus : 500;
    return NextResponse.json(
      { error: error?.message || "Refresh failed" },
      { status: httpStatus },
    );
  }
}
