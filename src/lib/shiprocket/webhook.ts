import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { ShiprocketWebhookPayload } from "./types";
import { mapShiprocketStatusToOrderStatus } from "./tracking";

// Shiprocket sends a configured secret value in the `X-Api-Key` header.
// We compare in constant time to prevent timing attacks.
export function verifyWebhookSignature(
  headerToken: string | null,
  expectedSecret: string,
): boolean {
  if (!headerToken || !expectedSecret) return false;
  const a = Buffer.from(headerToken);
  const b = Buffer.from(expectedSecret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export interface OrderUpdateFromWebhook {
  awbNumber?: string;
  courierName?: string;
  trackingLink?: string;
  estimatedDeliveryDate?: Date;
  status?: "Processing" | "Shipping" | "Delivered";
  isDelivered?: boolean;
  deliveredAt?: Date;
  "shiprocket.lastSyncedAt": Date;
  "shiprocket.lastStatus"?: string;
}

export function mapEventToOrderUpdate(
  payload: ShiprocketWebhookPayload,
): OrderUpdateFromWebhook {
  const update: OrderUpdateFromWebhook = {
    "shiprocket.lastSyncedAt": new Date(),
  };
  if (payload.awb) {
    update.awbNumber = payload.awb;
    // Set the tracking link straight from the webhook so the customer's
    // "Track" button works automatically (no manual Refresh needed). This is
    // Shiprocket's public tracking page for the AWB.
    update.trackingLink = `https://shiprocket.co/tracking/${payload.awb}`;
  }
  if (payload.courier_name) update.courierName = payload.courier_name;
  if (payload.etd) {
    const d = new Date(payload.etd);
    if (!isNaN(d.getTime())) update.estimatedDeliveryDate = d;
  }
  const statusText = payload.current_status || payload.shipment_status || "";
  if (statusText) update["shiprocket.lastStatus"] = statusText;
  const mapped = mapShiprocketStatusToOrderStatus(statusText);
  if (mapped) {
    update.status = mapped;
    if (mapped === "Delivered") {
      update.isDelivered = true;
      // Prefer the actual delivery timestamp from the payload over "now".
      const ts = payload.current_timestamp
        ? new Date(payload.current_timestamp)
        : null;
      update.deliveredAt = ts && !isNaN(ts.getTime()) ? ts : new Date();
    }
  }
  return update;
}

export async function applyWebhookToOrder(
  payload: ShiprocketWebhookPayload,
): Promise<{ matched: boolean; orderId?: string }> {
  await connectDB();
  const update = mapEventToOrderUpdate(payload);

  // Match priority:
  // 1. payload.order_id is OUR source id — we send String(order._id) on create.
  // 2. payload.sr_order_id is Shiprocket's own id — we store it as shiprocket.orderId.
  // 3. fall back to the AWB.
  let order: any = null;
  if (payload.order_id) {
    const oid = String(payload.order_id);
    if (/^[a-f0-9]{24}$/i.test(oid)) {
      order = await Order.findById(oid);
    }
    if (!order) {
      order = await Order.findOne({
        $or: [
          { "shiprocket.orderId": oid },
          { "shiprocket.shipmentId": oid },
        ],
      });
    }
  }
  if (!order && payload.sr_order_id) {
    const srid = String(payload.sr_order_id);
    order = await Order.findOne({
      $or: [
        { "shiprocket.orderId": srid },
        { "shiprocket.shipmentId": srid },
      ],
    });
  }
  if (!order && payload.awb) {
    order = await Order.findOne({ awbNumber: payload.awb });
  }
  if (!order) return { matched: false };

  // Don't downgrade status (e.g. a re-fired in-transit event after delivery)
  if (
    update.status === "Processing" &&
    (order.status === "Shipping" || order.status === "Delivered")
  ) {
    delete update.status;
  }
  if (update.status === "Shipping" && order.status === "Delivered") {
    delete update.status;
    delete update.isDelivered;
    delete update.deliveredAt;
  }

  await Order.findByIdAndUpdate(order._id, { $set: update });
  return { matched: true, orderId: String(order._id) };
}
