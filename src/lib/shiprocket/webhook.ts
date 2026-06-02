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
  if (payload.awb) update.awbNumber = payload.awb;
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
      update.deliveredAt = new Date();
    }
  }
  return update;
}

export async function applyWebhookToOrder(
  payload: ShiprocketWebhookPayload,
): Promise<{ matched: boolean; orderId?: string }> {
  await connectDB();
  const update = mapEventToOrderUpdate(payload);

  // Try matching by our internal order id (we send order._id as order_id in createOrder).
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
