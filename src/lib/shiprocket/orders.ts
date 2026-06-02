import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getShiprocketConfig, srFetch } from "./client";
import {
  ShiprocketCreateOrderPayload,
  ShiprocketCreateOrderResponse,
  ShiprocketError,
  ShiprocketOrderItem,
} from "./types";

type OrderDoc = any;
type ProductDoc = any;

function formatOrderDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

interface BuildPayloadOptions {
  order: OrderDoc;
  productMap: Map<string, ProductDoc>;
  config: Awaited<ReturnType<typeof getShiprocketConfig>>;
}

function buildPayload({
  order,
  productMap,
  config,
}: BuildPayloadOptions): ShiprocketCreateOrderPayload {
  const items: ShiprocketOrderItem[] = order.orderItems.map((it: any) => {
    const productId = String(it.product);
    const product = productMap.get(productId);
    const sku =
      (product?.sku && String(product.sku)) ||
      (product?.slug && String(product.slug)) ||
      `P-${productId.slice(-6)}`;
    return {
      name: it.name,
      sku,
      units: it.qty,
      selling_price: it.price,
      hsn: product?.hsnCode || config.defaultHsnCode || "",
    };
  });

  let totalWeight = 0;
  let maxLength = 0;
  let maxBreadth = 0;
  let totalHeight = 0;
  for (const it of order.orderItems) {
    const product = productMap.get(String(it.product));
    const w = Number(product?.weight) || config.defaultWeight;
    const l = Number(product?.length) || config.defaultLength;
    const b = Number(product?.breadth) || config.defaultBreadth;
    const h = Number(product?.height) || config.defaultHeight;
    totalWeight += w * it.qty;
    if (l > maxLength) maxLength = l;
    if (b > maxBreadth) maxBreadth = b;
    totalHeight += h * it.qty;
  }
  if (totalWeight <= 0) totalWeight = config.defaultWeight;
  if (maxLength <= 0) maxLength = config.defaultLength;
  if (maxBreadth <= 0) maxBreadth = config.defaultBreadth;
  if (totalHeight <= 0) totalHeight = config.defaultHeight;

  const address = order.shippingAddress;
  const isCod = String(order.paymentMethod).toLowerCase().includes("cod");

  return {
    order_id: String(order._id),
    order_date: formatOrderDate(new Date(order.createdAt || Date.now())),
    pickup_location: config.pickupLocation,
    channel_id: config.channelId,
    billing_customer_name: address.fullName,
    billing_address: address.address,
    billing_city: address.city,
    billing_pincode: address.pincode,
    billing_state: address.state || "",
    billing_country: "India",
    billing_email: address.email,
    billing_phone: String(address.phone),
    shipping_is_billing: true,
    order_items: items,
    payment_method: isCod ? "COD" : "Prepaid",
    sub_total: order.itemsPrice,
    length: Math.max(1, Math.round(maxLength)),
    breadth: Math.max(1, Math.round(maxBreadth)),
    height: Math.max(1, Math.round(totalHeight)),
    weight: Number(totalWeight.toFixed(3)),
  };
}

async function loadProductsForOrder(
  order: OrderDoc,
): Promise<Map<string, ProductDoc>> {
  const ids = Array.from(
    new Set(order.orderItems.map((it: any) => String(it.product))),
  );
  const products = await Product.find({ _id: { $in: ids } })
    .select("_id sku slug hsnCode weight length breadth height")
    .lean();
  const map = new Map<string, ProductDoc>();
  for (const p of products as ProductDoc[]) map.set(String(p._id), p);
  return map;
}

export interface PushResult {
  ok: true;
  srOrderId: string;
  shipmentId: string;
  awbCode?: string;
  courierName?: string;
}

export interface PushFailure {
  ok: false;
  code: string;
  message: string;
  httpStatus: number;
}

// Server-side push. Caller passes the order document (or _id).
// Updates `order.shiprocket.*` in place and persists to DB. Idempotent: if the order
// already has a Shiprocket order id, returns the existing IDs without re-pushing.
export async function pushOrderToShiprocket(
  orderOrId: OrderDoc | string,
): Promise<PushResult | PushFailure> {
  await connectDB();
  const order: OrderDoc =
    typeof orderOrId === "string"
      ? await Order.findById(orderOrId)
      : orderOrId;
  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      httpStatus: 404,
    };
  }
  if (order.shiprocket?.orderId) {
    return {
      ok: true,
      srOrderId: order.shiprocket.orderId,
      shipmentId: order.shiprocket.shipmentId,
      awbCode: order.awbNumber,
      courierName: order.courierName,
    };
  }
  try {
    const config = await getShiprocketConfig();
    const productMap = await loadProductsForOrder(order);
    const payload = buildPayload({ order, productMap, config });
    const res = await srFetch<ShiprocketCreateOrderResponse>(
      "/v1/external/orders/create/adhoc",
      { method: "POST", body: payload },
    );
    const update: Record<string, any> = {
      "shiprocket.orderId": String(res.order_id),
      "shiprocket.shipmentId": String(res.shipment_id),
      "shiprocket.status": "pushed",
      "shiprocket.lastSyncedAt": new Date(),
      "shiprocket.lastError": null,
      "shiprocket.lastStatusCode": res.status_code,
      "shiprocket.lastStatus": res.status,
      $inc: { "shiprocket.pushAttempts": 1 } as any,
    };
    if (res.awb_code) update.awbNumber = res.awb_code;
    if (res.courier_name) update.courierName = res.courier_name;
    const { $inc, ...set } = update;
    await Order.findByIdAndUpdate(order._id, { $set: set, $inc });
    return {
      ok: true,
      srOrderId: String(res.order_id),
      shipmentId: String(res.shipment_id),
      awbCode: res.awb_code,
      courierName: res.courier_name,
    };
  } catch (err: any) {
    const isSrErr = err instanceof ShiprocketError;
    const code = isSrErr ? err.code : "UNKNOWN";
    const httpStatus = isSrErr ? err.httpStatus : 500;
    const message = err?.message || "Shiprocket push failed";
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        "shiprocket.status": "failed",
        "shiprocket.lastError": `${code}: ${message}`,
        "shiprocket.lastSyncedAt": new Date(),
      },
      $inc: { "shiprocket.pushAttempts": 1 },
    });
    return { ok: false, code, message, httpStatus };
  }
}

export async function cancelShiprocketOrder(
  srOrderId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await srFetch("/v1/external/orders/cancel", {
      method: "POST",
      body: { ids: [Number(srOrderId)] },
    });
    return { ok: true };
  } catch (err: any) {
    const message = err?.message || "Shiprocket cancel failed";
    console.error("[shiprocket] cancel failed:", srOrderId, message);
    return { ok: false, message };
  }
}
