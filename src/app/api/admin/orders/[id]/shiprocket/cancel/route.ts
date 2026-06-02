import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { cancelShiprocketOrder } from "@/lib/shiprocket";

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
    await connectDB();
    const order: any = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!order.shiprocket?.orderId) {
      return NextResponse.json(
        { error: "Order is not pushed to Shiprocket" },
        { status: 400 },
      );
    }
    const result = await cancelShiprocketOrder(order.shiprocket.orderId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message || "Cancel failed" },
        { status: 500 },
      );
    }
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        "shiprocket.status": "cancelled",
        "shiprocket.lastSyncedAt": new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Cancel failed" },
      { status: 500 },
    );
  }
}
