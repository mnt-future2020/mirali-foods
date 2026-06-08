import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { srFetch } from "./client";
import {
  NormalizedTracking,
  ShiprocketTrackingData,
  ShiprocketTrackingResponse,
} from "./types";

function normalize(data: ShiprocketTrackingData): NormalizedTracking {
  const latestTrack = data.shipment_track?.[0];
  const expectedDelivery = latestTrack?.edd ? new Date(latestTrack.edd) : undefined;
  return {
    awb: data.awb_code || latestTrack?.awb_code,
    courierName: data.courier_name || latestTrack?.courier_name,
    status: data.current_status || latestTrack?.current_status || "",
    expectedDelivery:
      expectedDelivery && !isNaN(expectedDelivery.getTime())
        ? expectedDelivery
        : undefined,
    trackUrl: data.track_url,
    history: (data.shipment_track_activities || []).map((a) => ({
      date: a.date,
      status: a.status,
      activity: a.activity,
      location: a.location,
    })),
  };
}

export async function trackByAwb(awb: string): Promise<NormalizedTracking> {
  const res = await srFetch<ShiprocketTrackingResponse>(
    `/v1/external/courier/track/awb/${encodeURIComponent(awb)}`,
    { method: "GET" },
  );
  return normalize(res.tracking_data);
}

export async function trackByShipmentId(
  shipmentId: string,
): Promise<NormalizedTracking> {
  const res = await srFetch<ShiprocketTrackingResponse>(
    `/v1/external/courier/track/shipment/${encodeURIComponent(shipmentId)}`,
    { method: "GET" },
  );
  return normalize(res.tracking_data);
}

// Maps a Shiprocket textual status to our Order.status enum.
// Returns null if no transition is warranted.
export function mapShiprocketStatusToOrderStatus(
  status: string,
): "Processing" | "Shipping" | "Delivered" | null {
  if (!status) return null;
  const s = status.toLowerCase();

  // Order matters: several Shiprocket statuses contain the substring "deliver"
  // but are NOT a successful delivery to the customer. Handle those first.
  // "UNDELIVERED" / "DELIVERY FAILED" → still with the courier (will reattempt).
  if (
    s.includes("undelivered") ||
    s.includes("not delivered") ||
    s.includes("delivery failed")
  ) {
    return "Shipping";
  }
  // RTO = return to origin (parcel goes back to seller, not delivered to buyer).
  // Don't transition the customer's order to Delivered; leave status unchanged.
  if (s.includes("rto") || s.includes("return")) {
    return null;
  }
  // "OUT FOR DELIVERY" is a shipping state, not a completed delivery.
  if (s.includes("out for delivery")) return "Shipping";

  // True delivery to the customer ("DELIVERED").
  if (s.includes("delivered")) return "Delivered";

  if (
    s.includes("in transit") ||
    s.includes("shipped") ||
    s.includes("dispatched") ||
    s.includes("picked") ||
    s.includes("pickup")
  ) {
    return "Shipping";
  }
  if (
    s.includes("manifest") ||
    s.includes("label") ||
    s.includes("ready")
  ) {
    return "Processing";
  }
  return null;
}

// Applies a tracking snapshot to an order. Returns the updated order.
export async function syncOrderTracking(
  orderId: string,
): Promise<NormalizedTracking | null> {
  await connectDB();
  const order: any = await Order.findById(orderId);
  if (!order) return null;
  const shipmentId = order.shiprocket?.shipmentId;
  const awb = order.awbNumber;
  if (!shipmentId && !awb) return null;
  const tracking = shipmentId
    ? await trackByShipmentId(shipmentId)
    : await trackByAwb(awb);
  const update: Record<string, any> = {
    "shiprocket.lastSyncedAt": new Date(),
  };
  // Shiprocket is the source of truth — overwrite local fields (matches webhook behavior).
  if (tracking.awb) update.awbNumber = tracking.awb;
  if (tracking.courierName) update.courierName = tracking.courierName;
  if (tracking.trackUrl) update.trackingLink = tracking.trackUrl;
  if (tracking.expectedDelivery)
    update.estimatedDeliveryDate = tracking.expectedDelivery;
  const mapped = mapShiprocketStatusToOrderStatus(tracking.status);
  if (mapped && order.status !== "Delivered") {
    update.status = mapped;
    if (mapped === "Delivered") {
      update.isDelivered = true;
      update.deliveredAt = new Date();
    }
  }
  await Order.findByIdAndUpdate(order._id, { $set: update });
  return tracking;
}
